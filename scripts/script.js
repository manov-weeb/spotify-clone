// Array to store the list of songs
let songs = [];
// Create a new Audio object to play music
let currentAudio = new Audio();
// Variable to store the current folder
let currentFolder;

// Function to format time from seconds to MM:SS format
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");
  return `${formattedMinutes}:${formattedSeconds}`;
}

// Function to display the playbar
function displayPlaybar() {
  document.querySelector(".playbar").style.setProperty("bottom", 0 + "%");
}

//Function to set the document title to song Name
function setDocumentTitle(songPath) {
  let [songName, artist] = songPath.replaceAll("%20", " ").split("-");
  artist = artist.replaceAll(".m4a" || ".mp3", " ");
  
  document.title = `${songName} • ${artist}`
}

// Function to fetch songs from a specified folder
async function getSongs(folder) {
  // Fetch songs from the server
  currentFolder = folder;
  let files = await fetch(`http://127.0.0.1:5500/songs/${folder}/`);
  let response = await files.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let names = div.getElementsByTagName("a");

  songs = [];

  // Filter out non-song files and add them to the songs array
  for (let index = 0; index < names.length; index++) {
    const element = names[index];
    if (element.title.endsWith(".m4a") || element.title.endsWith(".mp3")) {
      songs.push(element.href.split(`/${folder}/`)[1]);
    }
  }

  let songUL = document.querySelector(".song-list ul");

  // Display songs in the UI
  songUL.innerHTML = "";
  for (const song of songs) {
    let [songName, songExtension] = song.replaceAll("%20", " ").split("-");
    songExtension = songExtension.replaceAll(".m4a" || ".mp3", " ");

    let imgLink = song.split(".m4a")[0];

    songUL.innerHTML += `<li data-song-path="${song}">
         <img class="album-cover" src="./songs/${folder}/${imgLink}.jpg" alt="Music Icon">
         <div class="info">
           <div>${songName}</div>
           <div>${songExtension}</div>
         </div>
         
      </li>`;
  }

  // Add click event listener to each song in the list
  songUL.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      const songPath = li.dataset.songPath;
      playMusic(songPath);
      displayPlaybar();
      setDocumentTitle(songPath);
    });
  });

  return songs;
}

// Function to display albums
async function displayAlbums() {
  // Fetch album information from the server
  let folders = await fetch(`http://127.0.0.1:5500/songs/`);
  let response = await folders.text();

  let div = document.createElement("div");
  div.innerHTML = response;

  let albums = document.querySelector("#albums");

  let links = div.getElementsByTagName("a");

  let array = Array.from(links);

  // Iterate through album links and display albums
  for (let index = 0; index < array.length; index++) {
    const e = array[index];

    if (e.href.includes("/songs/")) {
      let folder = e.href.split("/").slice(-1)[0];

      // Get metadata of the folder
      let folders = await fetch(
        `http://127.0.0.1:5500/songs/${folder}/info.json`
      );
      let response = await folders.json();

      albums.innerHTML += `
      <div data-folder=${folder} class="card">
           <img src="/songs/${folder}/cover.jpg" alt="${folder}">
      <div class="play">
           <svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512" style="fill: #1ed760;">
                <path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm74.77 217.3l-114.45 69.14a10.78 10.78 0 01-16.32-9.31V186.87a10.78 10.78 0 0116.32-9.31l114.45 69.14a10.89 10.89 0 010 18.6z" style="fill: #1ed760;"></path>
            </svg>
      </div>
      <h2>
           ${response.title}
      </h2>
      <p> ${response.description} </p>
 </div>`;
    }
  }

  // Add event listener to each album card
  let albumCards = document.querySelectorAll(".card");
  for (let i = 0; i < albumCards.length; i++) {
    albumCards[i].addEventListener("click", async (event) => {
      displayPlaybar();
      songs = await getSongs(event.currentTarget.dataset.folder);
      playMusic(songs[0]);
    });
  }
}

// Function to play music
const playMusic = (music, paused = false) => {
  // Set up UI for the playing song
  document.querySelector(".seekbar-and-time .duration").innerHTML = formatTime(
    currentAudio.duration
  );

  // Set the source of the audio element
  currentAudio.src = `/songs/${currentFolder}/` + music;

  // If not paused, play the audio
  if (!paused) {
    currentAudio.play();
    play.src = "./assets/pause.svg";
  }

  // Display song details
  document
    .querySelector(".song-cover-div img")
    .setAttribute("src", currentAudio.src.split(".m4a")[0] + ".jpg");

  let songUrl = currentAudio.src;

  let songName = decodeURIComponent(
    songUrl.split("/").pop().split("%20-%20")[0]
  );
  document.querySelector(".song-details-div h3").innerHTML = songName;

  let songArtist = decodeURIComponent(
    songUrl.split("/").pop().split("%20-%20")[1]
  ).replace(".m4a", "");
  document.querySelector(".song-details-div p").innerHTML = songArtist;
};

// Function to handle main operations
async function main() {
  // Initialize songs and play the first one
  await getSongs("chaand");
  playMusic(songs[0], true);

  // Display albums
  displayAlbums();

  // Event listener for play/pause button
  play.addEventListener("click", () => {
    if (currentAudio.paused) {
      currentAudio.play();
      play.src = "./assets/pause.svg";
    } else {
      currentAudio.pause();
      play.src = "./assets/play-music.svg";
    }
  });

  // Update current time and seek bar
  currentAudio.addEventListener("timeupdate", () => {
    const currentTime = currentAudio.currentTime;
    const duration = currentAudio.duration;
    const seekbar = document.querySelector(".seekbar");
    const playedPercentage = (currentTime / duration) * 100;

    // Update current time display
    document.querySelector(".current-time").innerHTML = formatTime(currentTime);

    // Update seek bar width
    document.querySelector(".seekbar-and-time .duration").innerHTML =
      formatTime(currentAudio.duration);
    seekbar.style.setProperty("--played-width", `${playedPercentage}%`);
  });

  // Update the position of the circle indicating the current position
  currentAudio.addEventListener("timeupdate", () => {
    const currentTime = currentAudio.currentTime;
    const duration = currentAudio.duration;
    const circle = document.querySelector(".circle");
    const seekbarWidth = document.querySelector(".seekbar").clientWidth;
    const currentPosition = (currentTime / duration) * seekbarWidth;
    circle.style.left = `${currentPosition}px`;
  });

  // Add an event listener to seekbar
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentAudio.currentTime = (currentAudio.duration * percent) / 100;
  });

  // Add event listener for hamburger menu
  document.querySelector(".hamburger").addEventListener("click", (e) => {
    document.querySelector(".left").style.left = 0;
  });

  // Add event listener for close button
  document.querySelector(".close-svg").addEventListener("click", (e) => {
    document.querySelector(".left").style.left = -100 + "%";
  });

  // Event listeners for previous and next buttons
  previous.addEventListener("click", (e) => {
    let index = songs.indexOf(currentAudio.src.split("/").slice(-1)[0]);
    if (index - 1 >= 0) {
      playMusic(songs[index - 1]);
    }
  });

  next.addEventListener("click", (e) => {
    let index = songs.indexOf(currentAudio.src.split("/").slice(-1)[0]);
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    }
  });

  // Event listener for volume control
  document
    .querySelector(".volume-rocker-div input")
    .addEventListener("change", (e) => {
      currentAudio.volume = parseInt(e.target.value) / 100;
    });

  // Event listener for mute button
  document
    .querySelector(".volume-rocker-div > img")
    .addEventListener("click", (e) => {
      if (e.target.src.includes("/volume-high.svg")) {
        e.target.src = e.target.src.replace(
          "/volume-high.svg",
          "/volume-mute.svg"
        );
        currentAudio.volume = 0.0;
        document.querySelector(".volume-rocker-div input").value = 0;
      } else {
        e.target.src = e.target.src.replace(
          "/volume-mute.svg",
          "/volume-high.svg"
        );
        currentAudio.volume = 0.2;
        document.querySelector(".volume-rocker-div input").value = 20;
      }
    });

  // Event listener for end of playback
  currentAudio.addEventListener("ended", () => {
    let currentIndex = songs.findIndex(
      (song) => song === currentAudio.src.split("/").slice(-1)[0]
    );

    if (currentIndex + 1 < songs.length) {
      playMusic(songs[currentIndex + 1]);
    } else {
      // Stop playback if it's the last song
      currentAudio.pause();
      play.src = "./assets/play-music.svg";
      document.querySelector(".song-info").innerHTML = "";
      document.querySelector(".song-time").innerHTML = "00:00 / 00:00";
      // Alternatively, you could loop back to the first song here
      // playMusic(songs[0]);
    }
  });

  console.log(currentAudio);
}

// Start the main operations
main();
