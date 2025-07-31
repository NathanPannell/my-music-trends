#r "nuget: Microsoft.Data.SqlClient, 6.1.0"
#r "nuget: dotenv.net"
#r "nuget: FSharp.Data"

open Microsoft.Data.SqlClient
open dotenv.net
open FSharp.Data


type AccessToken = JsonProvider<"sample/access_token.json">

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

        return response
        |> AccessToken.Parse
        |> _.AccessToken
    }

let main = 
    async {
        let! accessToken = getAccessToken ()
        printfn "%s" accessToken
    } 

Async.RunSynchronously main