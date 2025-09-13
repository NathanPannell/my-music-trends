#r "nuget: Microsoft.Data.SqlClient, 6.1.0"
#r "nuget: dotenv.net"
#r "nuget: FSharp.Data"

open Microsoft.Data.SqlClient
open System.Text.RegularExpressions
open dotenv.net
open FSharp.Data
open System.Data


// TYPE DEFINITIONS

type AccessTokenReponse = JsonProvider<"sample/access_token.json">
type PlaylistItemsResponse = JsonProvider<"sample/playlist_items.json">
type StagingEntity = {
    PlaylistSpotifyId : string
    TrackSpotifyId : string
    Rank : int
}
type PlaylistEntity = {
    PlaylistSpotifyId : string
    IsOrdered : bool
    IsSpotifyGenerated : bool
}


// GLOBAL CONSTANTS

let SpotifyApiUrl = "https://api.spotify.com/v1"
let SpotifyWebsiteUrl = "https://open.spotify.com"
let TrackIdFromMetaTag = @"<meta name=""music:song"" content=""https://open\.spotify\.com/track/([a-zA-Z0-9]+)""\s*/>" |> Regex
let SpotifyTrackLimit = 50


// UTILITY FUNCTIONS

let getEnv (name: string) : string =
    match System.Environment.GetEnvironmentVariable name with
    | null | "" ->
        DotEnv.Load()
        match System.Environment.GetEnvironmentVariable name with
        | null | "" -> failwithf "Missing environment variable: %s" name
        | value -> value
    | value -> value

let toDataTable<'T> (rows: 'T seq) : DataTable =
    let table = new DataTable()
    let recordType = typeof<'T>
    let props = recordType.GetProperties()
    
    props |> Array.iter (fun prop -> 
    table.Columns.Add(prop.Name, prop.PropertyType) 
    |> ignore)
    
    rows |> Seq.iter (fun row -> 
        let values = 
            props |> 
            Array.map (fun prop -> prop.GetValue(row))
        table.Rows.Add values |> ignore)
    
    table


// SPOTIFY IO OPERATIONS

let getAccessToken () : string option = 
    let response = 
        Http.Request(
            "https://accounts.spotify.com/api/token",
            httpMethod = HttpMethod.Post,
            body = FormValues [
                "grant_type", "client_credentials"
                "client_id", getEnv "client_id"
                "client_secret", getEnv "client_secret"
            ]
        )

    match response.StatusCode, response.Body with
    | 200, Text json -> 
        json
        |> AccessTokenReponse.Parse
        |> _.AccessToken
        |> Some
    | _ -> None

let rec getPlaylistFromApi (accessToken: string) (offset: int) (playlistId: string) : StagingEntity list option =
    let response =
            Http.Request (
                $"{SpotifyApiUrl}/playlists/{playlistId}/tracks",
                httpMethod = HttpMethod.Get,
                query = [
                    "offset", offset.ToString();
                    "limit", SpotifyTrackLimit.ToString()],
                headers = ["Authorization", $"Bearer {accessToken}"]
            )

    match response.StatusCode, response.Body with
    | 200, Text json -> 
        let playlistItems = json |> PlaylistItemsResponse.Parse  
    
        let currentTracks =  
            playlistItems.Items  
            |> Array.mapi (fun i playlistItem ->  
                {  
                    PlaylistSpotifyId = playlistId  
                    TrackSpotifyId = playlistItem.Track.Id  
                    Rank = i + offset + 1  
                })  
            |> List.ofArray  
        
        let subsequentTracks =  
            if playlistItems.Total >= offset + SpotifyTrackLimit then  
                getPlaylistFromApi accessToken (offset + SpotifyTrackLimit) playlistId  
                |> Option.defaultValue []  
            else  
                []  
        
        Some (currentTracks @ subsequentTracks)

    | _ -> None

let rec fetchPlaylistFromWeb (playlistId: string) : StagingEntity list option = 
    let response =
        Http.Request (
            $"{SpotifyWebsiteUrl}/playlist/{playlistId}",
            httpMethod = HttpMethod.Get
        )

    match response.StatusCode, response.Body with
    | 200, Text json -> 
        json
        |> TrackIdFromMetaTag.Matches
        |> Seq.map _.Groups.[1].Value
        |> Seq.mapi (fun i trackId -> 
        {
            PlaylistSpotifyId = playlistId
            TrackSpotifyId = trackId
            Rank = i + 1
            })
        |> List.ofSeq
        |> Some

    | _ -> None
    
// TODO: Convert to async for parallel processing
// TODO: Implement exponential backoff
let fetchAllPlaylistTracks (accessToken: string) (playlists : PlaylistEntity list) : StagingEntity list =
    playlists
    |> List.map (fun p ->
        if p.IsSpotifyGenerated 
        then fetchPlaylistFromWeb p.PlaylistSpotifyId
        else getPlaylistFromApi accessToken 0 p.PlaylistSpotifyId
    )
    |> List.collect (fun optList ->
        match optList with
        | Some items -> items
        | None -> [])


// DATABASE IO OPERATIONS

let getPlaylistRecordsFromDb (connectionString: string) : PlaylistEntity list =
    use conn = new SqlConnection(connectionString)
    conn.Open()
    
    use cmd = new SqlCommand("
        SELECT 
            playlist_spotify_id,
            is_ordered,
            is_spotify_generated
        FROM playlists", conn)
    
    use reader = cmd.ExecuteReader()

    let ordPlaylistSpotifyId = reader.GetOrdinal "playlist_spotify_id"
    let ordIsOrdered = reader.GetOrdinal "is_ordered"
    let ordIsSpotifyGenerated = reader.GetOrdinal "is_spotify_generated"

    [ while reader.Read() do
        yield {
            PlaylistSpotifyId = reader.GetFieldValue<string> ordPlaylistSpotifyId
            IsOrdered = reader.GetFieldValue<bool> ordIsOrdered
            IsSpotifyGenerated = reader.GetFieldValue<bool> ordIsSpotifyGenerated
        }
    ]

let insertRecordsInStaging (connectionString: string) (recordsForStaging: StagingEntity seq) : unit =
    use bulk = new SqlBulkCopy(connectionString, SqlBulkCopyOptions.FireTriggers)
    bulk.DestinationTableName <- "playlist_tracks_staging"
    bulk.WriteToServer(toDataTable recordsForStaging)


let main () = 
    let spotifyAccessToken = getAccessToken () |> Option.get
    let dbConnectionString = getEnv "connection_string"

    getPlaylistRecordsFromDb dbConnectionString
    |> fetchAllPlaylistTracks spotifyAccessToken
    |> insertRecordsInStaging dbConnectionString


main ()