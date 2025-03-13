import { centerX, centerY, zoomMain, maxIterations, renderSavedView } from "./main.js";

document.addEventListener("DOMContentLoaded", function () {
    // Event listener for clicking the save view button
    const viewName = document.getElementById("view-name");
    if (viewName) {
        document.getElementById("save-view").addEventListener("click", (event) => {
            save_view(event);
        });
    }

    // Retrieve and parse current user favorite views and popular views JSONs
    const favoriteViews = JSON.parse(document.getElementById("current-user-data").textContent).favorite_views;
    if (favoriteViews) {
        console.log(favoriteViews);  // Check output in console
    }

    // Event listener for Favorite Views clicks
    const favoriteViewsList = document.getElementById("favorite-views-list")
    if (favoriteViewsList) {
        favoriteViewsList.addEventListener("click", (event) => {
            if (event.target.tagName === "LI") {
                let x = parseFloat(event.target.dataset.x);
                let y = parseFloat(event.target.dataset.y);
                let zoom = parseFloat(event.target.dataset.zoom);
                let iter = parseInt(event.target.dataset.iter);

                renderSavedView(x, y, zoom, iter);
            }
        });
    }

    // Event listener for Popular Views clicks
    document.getElementById("popular-views-list").addEventListener("click", (event) => {
        if (event.target.tagName === "LI") {
            let x = parseFloat(event.target.dataset.x);
            let y = parseFloat(event.target.dataset.y);
            let zoom = parseFloat(event.target.dataset.zoom);
            let iter = parseInt(event.target.dataset.iter);

            renderSavedView(x, y, zoom, iter);
        }
    });

    // Event listener for Request Render button
    document.getElementById("request-render").addEventListener("click", () => {
        request_render();
    });

    // Event listeners to clear link placehoder in the download modal when deactivated
    const linkPlaceholder = document.getElementById("link-placeholder")
    const cancelRenderButton = document.getElementById("cancel-render-button")
    cancelRenderButton.addEventListener("click", () => {
        linkPlaceholder.innerHTML = "";
    });

    // Listen for progress updates via Websocket
    const socket = new WebSocket("ws://localhost:8000/ws/progress/");
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log(data.progress); // Debug print
        document.getElementById("progress-bar").style.width = data.progress + "%";
        document.getElementById("progress-text").innerText = data.progress + "%";
    };
    socket.onopen = function() {
        console.log("Websocket connection established.");
    };
    socket.onclose = function() {
        console.log("Websocket connection closed.");
    };

})


async function request_render() {
    const button = document.getElementById("request-render");
    button.disabled = true;
    button.innerText = "Rendering..."

    const x = centerX;
    const y = centerY;
    const zoom = zoomMain;
    const max_iterations = maxIterations;

    // Generete fetch URL
    const url = `request_render/?x=${x}&y=${y}&zoom=${zoom}&max_iterations=${max_iterations}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Failed to generate image");
        }

        const blob = await response.blob();

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "generated_image.jpg"
        link.innerText = "generated_image.jpg"

        // Append link to link placeholder div, clearing any previous links first
        const linkPlaceholder = document.getElementById("link-placeholder")
        linkPlaceholder.innerHTML = "";
        linkPlaceholder.appendChild(link);

        // Activate modal
        const saveRenderButton = document.getElementById("save-render-button")
        saveRenderButton.click();

        // Once link is clicked - deactivate modal
        const cancelRenderButton = document.getElementById("cancel-render-button")
        link.addEventListener("click", () => {
            cancelRenderButton.click()
        })

    } catch (error) {
        console.error(error);
    } finally {
        button.innerText = "Request Render";
        button.disabled = false;
    }
}


function save_view(event) {
    const csrftoken = document.querySelector("meta[name='csrf-token']").getAttribute("content");
    event.preventDefault();

    fetch("/save_mandelbrot_view", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({
            view_name: document.getElementById("view-name").value,
            center_x: document.getElementById("x-pos-text").textContent,
            center_y: document.getElementById("y-pos-text").textContent,
            max_iterations: document.getElementById("iters-input").value,
            zoom: document.getElementById("zoom-text").textContent,
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            // Handle error
            console.log(`Error: ${result.error}`);
            document.getElementById("view-name-error").innerText = `Error: ${result.error}`
        } else {
            // Print confirmation to console
            console.log(result.message);
            // Clear name and error fields after new view has been saved successfully
            document.getElementById("view-name-error").innerText = ""
            document.getElementById("view-name").value = ""
            // Close the "Save View" modal
            document.getElementById("close-save-view").click();
        }
    })
}





