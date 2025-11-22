create table playlists
(
    playlist_spotify_id         varchar(22) not null
        primary key,
    playlist_name               varchar(255),
    playlist_owner_spotify_id   varchar(255),
    is_ordered                  bit         not null,
    is_spotify_generated        bit         not null,
    playlist_owner_display_name varchar(255),
    playlist_art_uri            varchar(255)
)
go

create table tracks
(
    track_spotify_id varchar(22) not null
        primary key,
    track_name       nvarchar(255),
    album_art_uri    varchar(255), 
    artist_name      nvarchar(255)
)
go

create table playlist_tracks_history
(
    playlist_spotify_id varchar(22) not null
        references playlists,
    track_spotify_id    varchar(22) not null
        references tracks,
    rank                smallint,
    start_date          date        not null,
    end_date            date,
    constraint pk_playlist_tracks_history
        primary key (playlist_spotify_id, track_spotify_id, start_date)
)
go

create table playlist_tracks_staging
(
    playlist_spotify_id varchar(22) not null,
    track_spotify_id    varchar(22) not null,
    rank                smallint    not null,
    constraint pk_playlist_tracks_staging
        primary key (playlist_spotify_id, track_spotify_id)
)
go

CREATE TRIGGER dbo.tr_playlist_tracks_staging_insert
    ON dbo.playlist_tracks_staging
    AFTER INSERT
    AS
BEGIN
    SET NOCOUNT ON;

    -- 0. Abort if no records are present
    IF NOT EXISTS
            (SELECT 1 FROM dbo.playlist_tracks_staging)
        RETURN;

    -- 1. Ensure each track exists
    INSERT INTO dbo.tracks (track_spotify_id)
    SELECT DISTINCT pts.track_spotify_id
    FROM dbo.playlist_tracks_staging pts
             LEFT JOIN tracks t ON t.track_spotify_id = pts.track_spotify_id
    WHERE t.track_spotify_id IS NULL;

    -- 2. Close history rows that are obsolete
    UPDATE pth
    SET pth.end_date = GETUTCDATE()
    FROM dbo.playlist_tracks_history pth
    WHERE pth.end_date IS NULL
      AND NOT EXISTS (SELECT 1
                      FROM dbo.playlist_tracks_staging pts
                      WHERE pts.playlist_spotify_id = pth.playlist_spotify_id
                        AND pts.track_spotify_id = pth.track_spotify_id
                        AND pts.rank = pth.rank);

    -- 3. Open new rows
    INSERT INTO dbo.playlist_tracks_history
        (playlist_spotify_id, track_spotify_id, rank, start_date, end_date)
    SELECT pts.playlist_spotify_id,
           pts.track_spotify_id,
           pts.rank,
           GETUTCDATE(),
           NULL
    FROM dbo.playlist_tracks_staging pts
    LEFT JOIN dbo.playlist_tracks_history pth ON
        pth.track_spotify_id = pts.track_spotify_id
        AND pth.playlist_spotify_id = pts.playlist_spotify_id
        AND pth.rank = pts.rank
        AND pth.end_date IS NULL
    WHERE pth.track_spotify_id IS NULL; -- Record doesn't exist yet

    -- 4. Clear staging table
    TRUNCATE TABLE playlist_tracks_staging;
END
go