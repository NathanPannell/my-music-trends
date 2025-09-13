# My Music Trends

## Inspiration

Each year, [Spotify Wrapped](https://www.spotify.com/us/wrapped/) takes the world by storm. I love seeing my listening trends summed up for the year, but wondered if I could improve upon this by seeing my week-by-week and month-by-month listening habits.

Inspired by the visual style of [Data Is Beautiful](https://www.youtube.com/watch?v=a3w8I8boc_I) on YouTube, I created this project to save the complete history for a set of interesting playlists. With a script creating snapshots daily, I hope to revisit this project in time for Spotify Wrapped 2025 and create some dynamic visualizations!

---

## What It Does

My Music Trends is a service that records changes to playlists over time. It tracks modifications to reproduce a lossless series of snapshots representing every track in a playlist for each day it has been tracked.

To optimize storage volume, a technique called a [Type 2 Slowly Changing Dimension (SCD)](https://en.wikipedia.org/wiki/Slowly_changing_dimension#Type_2:_add_new_row) is implemented to track only necessary changes.

This application is cloud-native, utilizing an Azure SQL Database for storage and GitHub Actions for scheduling.

## [![Sync playlists daily](https://github.com/nathanpannell/my-music-trends/actions/workflows/main.yml/badge.svg)](https://github.com/nathanpannell/my-music-trends/actions/workflows/main.yml)

---

## Repository Structure

### `Main.fsx`

This is the primary script that:

- Gets all tracked playlists from Azure
- Fetches current tracks for these playlists from Spotify's Web API
- Copies snapshot data into Azure

### `sql/schema.sql`

This is the schema for the Azure SQL Database that:

- Receives snapshot data from `Main.fsx`
- Uses a trigger to save changes according to **Type 2 SCD**

---

## License

This project is licensed under the [MIT License](LICENSE).
