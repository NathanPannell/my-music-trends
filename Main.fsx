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
type TrackMetadataResponse = JsonProvider<"sample/tracks.json">
type TrackEntity = {
    TrackSpotifyId : string
    TrackName : string
    AlbumArtUri : string
    ArtistName : string
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
    
    table.Rows.Count |> printfn "Created data table containing %d rows"

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
    printfn "Fetching playlist %s from Spotify Web API with offset=%d" playlistId offset
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

    | _ -> 
        printfn "Error fetching playlist..."
        None

let rec fetchPlaylistFromWeb (playlistId: string) : StagingEntity list option = 
    printfn "Fetching playlist %s from open.spotify.com" playlistId
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

    | _ -> 
        printfn "Error fetching playlist..."
        None
    
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

let fetchTrackMetadata (accessToken: string) (trackIds: string list) : TrackEntity list =
    let batches = trackIds |> List.chunkBySize SpotifyTrackLimit
    
    batches
    |> List.collect (fun batch ->
        printfn "Fetching metadata for %d tracks..." batch.Length
        
        // Rate limiting delay
        System.Threading.Thread.Sleep(500)

        let idsParam = String.concat "," batch
        let response = 
            Http.Request(
                $"{SpotifyApiUrl}/tracks",
                httpMethod = HttpMethod.Get,
                query = ["ids", idsParam],
                headers = ["Authorization", $"Bearer {accessToken}"]
            )

        match response.StatusCode, response.Body with
        | 200, Text json ->
            let data = TrackMetadataResponse.Parse(json)
            data.Tracks
            |> Array.map (fun t -> 
                let albumArt = 
                    if t.Album.Images.Length > 0 
                    then t.Album.Images.[0].Url 
                    else ""
                let artistName =
                    if t.Artists.Length > 0
                    then t.Artists.[0].Name
                    else ""
                {
                    TrackSpotifyId = t.Id
                    TrackName = t.Name
                    AlbumArtUri = albumArt
                    ArtistName = artistName
                })
            |> List.ofArray
        | _ -> 
            printfn "Error fetching track metadata"
            []
    )


// DATABASE IO OPERATIONS

let getPlaylistRecordsFromDb (connectionString: string) : PlaylistEntity list =
    printfn "Fetching playlist IDs from database"
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
    printfn "Successfully wrote %d records to database" (recordsForStaging |> Seq.length)


let getTracksWithMissingMetadata (connectionString: string) : string list =
    printfn "Fetching tracks with missing metadata..."
    use conn = new SqlConnection(connectionString)
    conn.Open()
    
    use cmd = new SqlCommand("
        SELECT track_spotify_id 
        FROM tracks 
        WHERE track_name IS NULL OR album_art_uri IS NULL OR artist_name IS NULL", conn)
    
    use reader = cmd.ExecuteReader()
    [ while reader.Read() do
        yield reader.GetString(0)
    ]

let updateTrackMetadata (connectionString: string) (tracks: TrackEntity list) : unit =
    if tracks.IsEmpty then ()
    else
        printfn "Updating metadata for %d tracks..." tracks.Length
        use conn = new SqlConnection(connectionString)
        conn.Open()
        
        // Using a transaction for bulk updates could be better, but simple loop is fine for now
        // or construct a large UPDATE statement or use a temp table.
        // Given the likely volume, individual updates might be slow but safe enough.
        // Let's use a parameterized query in a loop for simplicity and safety.
        
        use cmd = new SqlCommand("
            UPDATE tracks 
            SET track_name = @name, album_art_uri = @art, artist_name = @artist
            WHERE track_spotify_id = @id", conn)
            
        let pId = cmd.Parameters.Add("@id", SqlDbType.VarChar, 22)
        let pName = cmd.Parameters.Add("@name", SqlDbType.NVarChar, 255)
        let pArt = cmd.Parameters.Add("@art", SqlDbType.VarChar, 255)
        let pArtist = cmd.Parameters.Add("@artist", SqlDbType.NVarChar, 255)
        
        tracks |> List.iter (fun t ->
            pId.Value <- t.TrackSpotifyId
            pName.Value <- t.TrackName
            pArt.Value <- t.AlbumArtUri
            pArtist.Value <- t.ArtistName
            cmd.ExecuteNonQuery() |> ignore
        )
        printfn "Successfully updated track metadata"



let main () = 
    let spotifyAccessToken = getAccessToken () |> Option.get
    spotifyAccessToken |> printfn "Fetched Spotify access token:\n%s\n"

    let dbConnectionString = getEnv "connection_string"

    getPlaylistRecordsFromDb dbConnectionString
    |> fetchAllPlaylistTracks spotifyAccessToken
    |> insertRecordsInStaging dbConnectionString

    // New metadata population flow
    let missingTracks = getTracksWithMissingMetadata dbConnectionString
    if not missingTracks.IsEmpty then
        printfn "Found %d tracks with missing metadata" missingTracks.Length
        let trackMetadata = fetchTrackMetadata spotifyAccessToken missingTracks
        updateTrackMetadata dbConnectionString trackMetadata
    else
        printfn "No tracks found with missing metadata"



main ()