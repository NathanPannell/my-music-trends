#r "nuget: Microsoft.Data.SqlClient, 6.1.0"
#r "nuget: dotenv.net"
#r "nuget: FSharp.Data"

open Microsoft.Data.SqlClient
open System.Text.RegularExpressions
open dotenv.net
open FSharp.Data
open System
open System.Data

type AccessTokenReponse = JsonProvider<"sample/access_token.json">
type PlaylistResponse = JsonProvider<"sample/playlist.json">

type PlaylistTracksStagingDb = { PlaylistSpotifyId : string ; TrackSpotifyId : string ; Rank : int}
type PlaylistDb = { PlaylistId : int ; PlaylistSpotifyId : string ; PlaylistOwnerSpotifyId : string ; PlaylistName : string option ; PlaylistDescription : string option ; IsOrdered : bool ; IsSpotifyGenerated : bool}

let baseApiUrl = "https://api.spotify.com/v1"
let baseWebUrl = "https://open.spotify.com"

let metaTagRegex = 
    @"<meta name=""music:song"" content=""https://open\.spotify\.com/track/([a-zA-Z0-9]+)""\s*/>" 
    |> Regex

let getEnv name =
    match System.Environment.GetEnvironmentVariable name with
    | null | "" ->
        DotEnv.Load()
        match System.Environment.GetEnvironmentVariable name with
        | null | "" -> failwithf "Missing environment variable: %s" name
        | value -> value
    | value -> value

let getAccessToken () = 
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
    | _ ->
            None

// TODO: Make this paginate across the response
let rec getPlaylistDirect accessToken  playlistId offset backoff   =
    let response =
            Http.Request (
                $"{baseApiUrl}/playlists/{playlistId}",
                httpMethod = HttpMethod.Get,
                headers = ["Authorization", $"Bearer {accessToken |> Option.get}"]
            )

    match response.StatusCode, response.Body with
    | 200, Text json -> 
        json
        |> PlaylistResponse.Parse
        |> _.Tracks.Items
        |> Array.map _.Track.Id
        |> List.ofArray
        |> List.mapi (fun i trackId -> 
        {
            PlaylistSpotifyId = playlistId
            TrackSpotifyId = trackId
            Rank = i + 1 + offset
        })
        |> Some
    | 429, _ ->
        if backoff < 2 then getPlaylistDirect accessToken playlistId offset (backoff * 2) else None
    | _ -> None


let rec getPlaylistBrowser playlistId backoff = 
    let response =
        Http.Request (
            $"{baseWebUrl}/playlist/{playlistId}",
            httpMethod = HttpMethod.Get
        )

    match response.StatusCode, response.Body with
    | 200, Text json -> 
        json
        |> metaTagRegex.Matches
        |> Seq.map _.Groups.[1].Value
        |> Seq.toList
        |> List.mapi (fun i trackId -> 
        {
            PlaylistSpotifyId = playlistId
            TrackSpotifyId = trackId
            Rank = i + 1
            })
        |> Some
    | 429, _ ->
        if backoff < 2 then getPlaylistBrowser playlistId (backoff * 2) else None
    | _ -> None
    

let getPlaylistTracks accessToken (playlists : list<PlaylistDb>) =
    playlists
    |> List.map (fun p ->
        if p.IsSpotifyGenerated 
        then getPlaylistBrowser p.PlaylistSpotifyId 1 
        else getPlaylistDirect accessToken p.PlaylistSpotifyId 0 1
    )

type SqlDataReader with
    member this.TryGet<'T>(ordinal: int) =
        if this.IsDBNull ordinal then None
        else Some (this.GetFieldValue<'T> ordinal)

    member this.GetOrFail<'T>(ordinal: int) =
        this.GetFieldValue<'T> ordinal

let getPlaylists (connectionString: string) =
    use conn = new SqlConnection(connectionString)
    conn.Open()
    
    use cmd = new SqlCommand("
        SELECT 
            playlist_id,
            playlist_spotify_id,
            playlist_owner_spotify_id,
            playlist_name,
            playlist_description,
            is_ordered,
            is_spotify_generated
        FROM playlists", conn)
    
    use reader = cmd.ExecuteReader()

    let ordPlaylistId = reader.GetOrdinal "playlist_id"
    let ordPlaylistSpotifyId = reader.GetOrdinal "playlist_spotify_id"
    let ordPlaylistOwnerSpotifyId = reader.GetOrdinal "playlist_owner_spotify_id"
    let ordPlaylistName = reader.GetOrdinal "playlist_name"
    let ordPlaylistDescription = reader.GetOrdinal "playlist_description"
    let ordIsOrdered = reader.GetOrdinal "is_ordered"
    let ordIsSpotifyGenerated = reader.GetOrdinal "is_spotify_generated"

    [ while reader.Read() do
        yield {
            PlaylistId = reader.GetOrFail<int> ordPlaylistId
            PlaylistSpotifyId = reader.GetOrFail<string> ordPlaylistSpotifyId
            PlaylistOwnerSpotifyId = reader.GetOrFail<string> ordPlaylistOwnerSpotifyId
            PlaylistName = reader.TryGet<string> ordPlaylistName
            PlaylistDescription = reader.TryGet<string> ordPlaylistDescription
            IsOrdered = reader.GetOrFail<bool> ordIsOrdered
            IsSpotifyGenerated = reader.GetOrFail<bool> ordIsSpotifyGenerated
        }
    ]

let flattenPlaylistTracks (playlistTracks : list<option<list<PlaylistTracksStagingDb>>>) = 
    playlistTracks
    |> List.collect (fun optList ->
        match optList with
        | Some items -> items
        | None -> [])

let toDataTable (rows: seq<PlaylistTracksStagingDb>) =
    let table = new DataTable()
    table.Columns.Add("PlaylistSpotifyId", typeof<string>) |> ignore
    table.Columns.Add("TrackSpotifyId", typeof<string>)   |> ignore
    table.Columns.Add("Rank", typeof<int>)                |> ignore

    for row in rows do
        table.Rows.Add(row.PlaylistSpotifyId :> obj, row.TrackSpotifyId :> obj, row.Rank :> obj) |> ignore

    table

let insertRecordsInStaging (connectionString: string) (recordsForStaging: seq<PlaylistTracksStagingDb>) =
    use conn = new SqlConnection(connectionString)
    conn.Open()
    use bulk = new SqlBulkCopy(conn)
    bulk.DestinationTableName <- "playlist_tracks_staging"
    bulk.WriteToServer(toDataTable recordsForStaging)


let main () = 
    // Database
    // 1. Establish db connection

    let connectionString = getEnv "connection_string"
    printfn "connection string"

    // 2. Fetch all playlist IDs
    let playlists = getPlaylists connectionString
    printfn "got playlist ids"


    // Spotify
    // 3. Get access token
    let accessToken = getAccessToken ()
    printfn "got access token"
    

    // 4. Get each playlist's track list
    let playlistTracks = getPlaylistTracks accessToken playlists
    printfn "got playlist tracks"

    let recordsForStaging = flattenPlaylistTracks playlistTracks
    printfn "got records for staging"


    // Database 
    // 5. Dump all records in the staging table
    do insertRecordsInStaging connectionString recordsForStaging
    printfn "done"


main ()