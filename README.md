# PermurOS

PermurOS is a Django-based website for children, designed to be run in kiosk mode on a
Raspberry Pi or similar.

Features:

- **Write** - a document app (based on ckeditor)
- **Draw** - a drawing app
- **Spotify** - play music from a playlist on your spotify account
- **Bank** - simple pocket money tracker

## Installation

This can be run locally, on another machine on your network, or deployed to a remote
server.

Personally I like to run it on my main desktop machine with `runserver` - see
"Development" below. This makes debugging and testing new features easier, and gives me
added control over when it's available.

- Run ``manage.py compress` to compress assets before `manage.py collectstatic`

### Install raspbian

Clean raspbian install, then:

```
git clone git@github.com:radiac/permuros.git permuros
```

### Install spotifyd:

```
# install
wget spotifyd-linux-aarch64-...
tar zxvf spotifyd-linux-aarch64-...
sudo cp spotifyd /usr/local/bin
sudo chmod 755 /usr/local/bin/spotifyd
spotifyd authenticate

# test
spotifyd --no-daemon

# systemd
curl -o /etc/systemd/user/spotifyd.service https://raw.githubusercontent.com/Spotifyd/spotifyd/refs/heads/master/contrib/spotifyd.service
# change ExecStart path
vi /etc/systemd/user/spotifyd.service
# as user on system (not via ssh)
systemctl --user enable spotifyd.service --now
```

### Kiosk mode

Update `kiosk.sh` with the web address, and `kiosk.service` with the username.

```
sudo ln -s /home/USER/permuros/os/kiosk.service /etc/systemd/user/
systemctl --user enable kiosk.service --now
```

## Development

### Docker

Docker is the most reliable way to run this. Run using docker compose:

```bash
# Run the postgres and django containers
docker compose up postgres
docker compose up django
# Connect to the running django container
docker compose exec django /bin/bash
# Start the Django container without running Django
docker compose run --service-ports --entrypoint=/bin/bash django
```

The database container has a script to dump from the database:

```bash
docker compose exec postgres /project/docker/postgres/dump.sh
```

The dumped file is in `../docker-store/backup`

To load the database from a dump (default `database.dump`):

```bash
docker compose exec postgres /project/docker/postgres/restore.sh
```

### Direct

Or to run it directly on your system, you'll need to set a couple of env vars:

```bash
DJANGO_CONFIGURATION=Local \
DJANGO_STORE_PATH=local \
DJANGO_SPOTIFY_CLIENT_ID=client_id \
DJANGO_SPOTIFY_CLIENT_SECRET=client_secret \
./manage.py runserver 0:7000
```

### Testing

The project is configured to use `pytest`:

```bash
pytest
```
