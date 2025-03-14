
const Repeat = {
  OFF: 'off',
  CONTEXT: 'context',
  TRACK: 'track',
}
Repeat.modes = [Repeat.OFF, Repeat.CONTEXT, Repeat.TRACK];

class Player {
  // Settings from Django
  settings;

  // Current device
  deviceId;
  deviceNameToId;
  deviceIdToName;

  // Current track
  playing = false;
  repeating = Repeat.CONTEXT;

  // Playlist listing
  trackIdToEl;
  trackEls;
  currentTrackId = null;
  pollTimeout = null;

  constructor(settings) {
    this.settings = settings;
    this.devices().then((devices) => {
      this.deviceId = this.deviceNameToId[this.settings.deviceName] || devices[0].id;
      console.log(`Selecting device: ${this.deviceIdToName[this.deviceId]}`);
      this.transfer();
    });

    this.trackIdToEl = {};
    this.trackEls = document.querySelectorAll("[data-track-id]");
    this.trackEls.forEach((el) => {
      this.trackIdToEl[el.dataset.trackId] = el;
      el.onclick = () => this.play(el.dataset.trackId);
    });

    // Rapid check state at first login
    this.queueCheckState(100, 100, 200, 200, 300);
    this.setAccessToken(settings.accessToken, settings.accessExpiresIn);

    // Bind buttons
    this.playButton = document.querySelector(".player .playToggle");
    this.playButton.onclick = (e) => {
      if (this.playing) {
        this.pause();
      } else {
        this.play();
      }
    };
    document.querySelector(".player .previous").onclick = () => this.previous();
    document.querySelector(".player .next").onclick = () => this.next();
    this.repeatEl = document.querySelector(".player .repeat");
    this.repeatEl.onclick = () => this.repeat();
    setTimeout(() => this.repeat(Repeat.CONTEXT), 500);
  }

  get accessToken() {
    return this.settings.accessToken;
  }

  setAccessToken(accessToken, accessExpiresIn) {
    this.settings.accessToken = accessToken;
    this.settings.accessExpiresIn = accessExpiresIn;
    setTimeout(() => this.refreshAccessToken(), accessExpiresIn * 1000);
  }

  async refreshAccessToken() {
    console.log("Refreshing access token");
    try {
      const response = await fetch(this.settings.refreshTokenUrl);
      data = await response.json();
      this.setAccessToken(data.accessToken, data.accessExpiresIn);
    } catch (error) {
      console.error("Error fetching data:", error); // Handle any errors
      return;
    }
  }

  _get(url, check = false) {
    return this._request("GET", url, null, check);
  }

  _put(url, data, check = true) {
    return this._request("PUT", url, data, check);
  }

  _post(url, data, check = true) {
    return this._request("POST", url, data, check);
  }

  async _request(method, url, data, check) {
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      Accept: 'application/json',
    };
    const body = data ? JSON.stringify(data) : undefined;
    const fullUrl = `https://api.spotify.com/v1${url}`;

    try {
      const response = await fetch(fullUrl, { method, headers, body });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      if (check) {
        // Something occurred. Update the state soon.
        this.queueCheckState(100);
      }

      if (response.status === 204) {
        return {};
      }
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      return data;
    } catch (error) {
      console.error("Error fetching data:", error); // Handle any errors
      return;
    }
  }

  devices() {
    return this._get("/me/player/devices").then(({ devices }) => {
      console.log("Found devices:", devices);
      this.deviceNameToId = {};
      this.deviceIdToName = {};
      devices.forEach((item) => {
        this.deviceNameToId[item.name] = item.id;
        this.deviceIdToName[item.id] = item.name;
      });
      return devices;
    });
  }

  transfer() {
    /** Transfer to this.deviceId */
    return this._put(
      "/me/player",
      {
        device_ids: [this.deviceId],
        play: false,
      },
      false
    ).then(() => {
      console.log(`Transferred to device ${this.deviceIdToName[this.deviceId]}`);
    });
  }

  play(trackId) {
    const data = {
      context_uri: `spotify:playlist:${this.settings.playlistId}`,
    };
    if (trackId) {
      data["offset"] = { uri: `spotify:track:${trackId}` };
      this.trackSelected(trackId);
    }
    return this._put("/me/player/play", data).then(() => {});
  }

  pause() {
    return this._put("/me/player/pause").then(() => {});
  }

  previous() {
    return this._post("/me/player/previous").then(() => {});
  }

  next() {
    return this._post("/me/player/next").then(() => {});
  }

  repeat(mode=null) {
    if (!mode) {
      // Cycle
      const currentIndex = Repeat.modes.indexOf(this.repeating);
      const nextIndex = (currentIndex + 1) % Repeat.modes.length;
      mode = Repeat.modes[nextIndex];
    }
    this._setRepeat(mode);
    // Something is broken with this endpoint - it doesn't look in the body, needs the
    // state on the query string. The response is also 200 (with some ID) not 204
    return this._put(`/me/player/repeat?state=${mode}`).then(() => {});
  }
  _setRepeat(mode) {
    // This really should be set in checkState - the API docs say we should get
    // data.repeat_state, but it doesn't come through. Have to rely on our state.
    // If this is ever fixed, we'll get "Repeat state now available" logged and can
    // move this logic
    this.repeating = mode;

    for (const modeType of Repeat.modes) {
      this.repeatEl.classList.toggle(`repeat-${modeType}`, modeType == mode);
    }
  }

  trackSelected(trackId) {
    // Called when this track is playing
    if (trackId == this.currentTrackId) {
      return;
    }

    this.currentTrackId = trackId;
    this.trackEls.forEach((el) => {
      el.classList.remove("selected");
    });
    if (trackId) {
      this.trackIdToEl[this.currentTrackId]?.classList.add("selected");
    }
  }

  async checkState(...delays) {
    try {
      const response = await this._get("/me/player/currently-playing");

      const data = response;
      if (data) {
        if (data.is_playing) {
          // data contains full item info, eg:
          // console.log("Currently playing:", data.item.name);
          this.playing = true;
          this.trackSelected(data.item.id);
        } else {
          this.playing = false;
          this.trackSelected(null);
        }
        this.playButton.classList.toggle("playing", this.playing);
      }

      if (data.repeat_state) {
        console.log('Repeat state now available! Update code.');
      }
    } catch (error) {
      console.error("Error when polling:", error);
    }
    this.queueCheckState(...delays);
  }

  queueCheckState(...delays) {
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
    }
    let delay = 5000;
    if (delays.length > 0) {
      delay = delays.shift();
    }

    this.pollTimeout = setTimeout(() => this.checkState(...delays), delay);
  }
}

const player = new Player(
  JSON.parse(document.getElementById("player-settings").textContent)
);
