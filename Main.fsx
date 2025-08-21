#r "nuget: Microsoft.Data.SqlClient, 6.1.0"
#r "nuget: dotenv.net"
#r "nuget: FSharp.Data"

open Microsoft.Data.SqlClient
open System.Text.RegularExpressions
open dotenv.net
open FSharp.Data


type AccessToken = JsonProvider<"sample/access_token.json">
type Playlist = JsonProvider<"sample/playlist.json">
type User = JsonProvider<"sample/user.json">

let baseApiUrl = "https://api.spotify.com/v1"
let baseWebUrl = "https://open.spotify.com"

let metaTagPattern = @"<meta name=""music:song"" content=""https://open\.spotify\.com/track/([a-zA-Z0-9]+)""\s*/>"
let metaTagRegex = new Regex(metaTagPattern)

let envVar name =
    match System.Environment.GetEnvironmentVariable name with
    | null | "" ->
        DotEnv.Load()
        match System.Environment.GetEnvironmentVariable name with
        | null | "" -> failwithf "Missing environment variable: %s" name
        | value -> value
    | value -> value

let getAccessToken () = 
    async {
        let! response = 
            Http.AsyncRequestString(
                "https://accounts.spotify.com/api/token",
                httpMethod = HttpMethod.Post,
                body = FormValues [
                    "grant_type", "client_credentials"
                    "client_id", envVar "client_id"
                    "client_secret", envVar "client_secret"
                ]
            )

        let token = AccessToken.Parse response
        return token.AccessToken
    }

// TODO: Make this paginate across the response
let getPlaylistDirect accessToken playlistId =
    async {
        let! response =
            Http.AsyncRequest (
                $"{baseApiUrl}/playlists/{playlistId}",
                httpMethod = HttpMethod.Get,
                headers = ["Authorization", $"Bearer {accessToken}"]
            )

        match response.StatusCode, response.Body with
        | 200, Text json -> 
            let playlist = Playlist.Parse json
            return
                playlist.Tracks.Items
                |> Array.map _.Track.Id
                |> List.ofArray
        | _ ->
            failwith $"Unable to retrieve playlist {playlistId} via the Web API"
            return List.empty<string>
    }

let getPlaylistBrowser playlistId = 
    async {
        let! response =
            Http.AsyncRequest (
                $"{baseWebUrl}/playlist/{playlistId}",
                httpMethod = HttpMethod.Get
            )

        match response.StatusCode, response.Body with
        | 200, Text json -> 
            return
                metaTagRegex.Matches json
                |> Seq.map (fun m -> m.Groups.[1].Value)
                |> Seq.toList
        | _ -> 
            failwith $"Unable to retrieve playlist {playlistId} via open.spotify.com"
            return List.empty<string>
    }

let main = 
    async {
        let! accessToken = getAccessToken ()

        let djspinthat = "2OecBYmFJPaS5TYvWwd4Lr"
        let onrepeat = "37i9dQZF1EpzfSVGAiUQT4"

        let! trackIds = getPlaylistDirect accessToken djspinthat
        printfn "First page of track IDs of a manually created playlist: %A" trackIds

        let! trackIds = getPlaylistBrowser onrepeat
        printfn "First 30 track IDs for an auto-generated playlist: %A" trackIds
    } 

Async.RunSynchronously main