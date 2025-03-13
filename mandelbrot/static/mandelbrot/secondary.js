import { centerX, centerY, zoomMain, maxIterations, renderSavedView } from "./main.js";

let globalImgURL = null;

document.addEventListener("DOMContentLoaded", function () {
    // Event listener for clicking the save view button
    const viewName = document.getElementById("view-name");
    if (viewName) {
        document.getElementById("save-view").addEventListener("click", (event) => {
            save_view(event);
        });
    }

    // Retrieve and parse current user favorite views and popular views JSONs
    // const favoriteViews = JSON.parse(document.getElementById("current-user-data").textContent).favorite_views;
    // if (favoriteViews) {
    //     console.log(favoriteViews);  // Check output in console
    // }

    // Event listener for Favorite Views clicks
    const favoriteViewsList = document.getElementById("favorite-views-list");
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
    const popularViewList = document.getElementById("popular-views-list");
    if (popularViewList) {
        popularViewList.addEventListener("click", (event) => {
            if (event.target.tagName === "LI") {
                let x = parseFloat(event.target.dataset.x);
                let y = parseFloat(event.target.dataset.y);
                let zoom = parseFloat(event.target.dataset.zoom);
                let iter = parseInt(event.target.dataset.iter);
                renderSavedView(x, y, zoom, iter);
            }
        });
    }

    // Event listener for Request Render button
    const requestRenderButton = document.getElementById("request-render");
    if (requestRenderButton) {
        requestRenderButton.addEventListener("click", () => {
            requestRenderButton.disabled = true;
            requestRenderButton.innerText = "Rendering..."
            request_render();
        });
    }

    // Event listener to clear link and reactivate "Request Render" button and clear memory when the download modal is closed
    const linkPlaceholder = document.getElementById("link-placeholder")
    const saveRenderModal = document.getElementById("saveRenderModal");
    if (saveRenderModal) {
        saveRenderModal.addEventListener("hidden.bs.modal", function (event) {
            linkPlaceholder.innerHTML = "";
            // Revert "Request render" button to acive state
            requestRenderButton.innerText = "Request Render";
            requestRenderButton.disabled = false;

            // Release memory. Wait 2 seconds for the file to actually download and save if the link was clicked
            if (globalImgURL) {
                setTimeout(() => {
                    URL.revokeObjectURL(globalImgURL);  // Release binary image data memory
                    globalImgURL = null;
                    console.log("Released image memory.");  // Debug print
                }, 2000)
            }
        });
    }

})


async function request_render() {

    const x = centerX;
    const y = centerY;
    const zoom = zoomMain;
    const max_iterations = maxIterations;

    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");

    progressBar.style.display = "block";
    progressText.style.display = "block";

    // Open WebSocket connection
    const socket = new WebSocket("ws://localhost:8000/ws/progress/");
    socket.binaryType = "arraybuffer"; // Expect binary data for images

    socket.onopen = function() {
        console.log("Websocket connection established.");
        const renderData = JSON.stringify({
            "type": "start_render",
            "x": x,
            "y": y,
            "zoom": zoom,
            "max_iterations": max_iterations,
        });
        socket.send(renderData)  // Send start_rendering message
    };

    socket.onclose = function() {
        console.log("Websocket connection closed.");
    };

    // Listen for progress updates via Websocket or for completed image file binary data
    socket.onmessage = function(event) {

        if (typeof event.data === "string") {
            // Handle JSON-based progress updates
            const data = JSON.parse(event.data);
            if (data.type ==="progress_update") {
                // console.log(data.progress);  // Debug print
                progressBar.style.width = data.progress + "%";
                progressText.innerText = data.progress + "%";
            }
        } else if (event.data instanceof ArrayBuffer) {
            // Handle binary image data
            console.log("Received image data.");  // Debug print
            const blob = new Blob([event.data], { type: "image/jpeg" });
            globalImgURL = URL.createObjectURL(blob);  // Store globally
            socket.close();  // Close WebSocket connection once image is received

            // Reset and hide progress bar
            progressBar.style.display = "none";
            progressText.style.display = "none";
            progressBar.style.width = "0" + "%";
            progressText.innerText = "0" + "%";

            // Create link object
            const link = document.createElement("a");
            link.href = globalImgURL;
            link.download = "generated_image.jpg"
            link.innerText = "generated_image.jpg"

            // Append link to link placeholder div, clearing any previous links first
            const linkPlaceholder = document.getElementById("link-placeholder");
            linkPlaceholder.innerHTML = "";
            linkPlaceholder.appendChild(link);

            // Activate modal
            const saveRenderButton = document.getElementById("save-render-button");
            saveRenderButton.click();

            // Once link is clicked - deactivate modal, free image data memory and revert "Request data" button to active state
            link.addEventListener("click", () => {
                const cancelRenderButton = document.getElementById("cancel-render-button");
                cancelRenderButton.click();

                // Moved to event listener for closing the modal.
                // Revoke URL after the file has been downloaded, wait 3 seconds.
                // setTimeout(() => {
                //     URL.revokeObjectURL(globalImgURL);  // Release binary image data memory
                //     globalImgURL = null;
                //     console.log("Released image memory.");  // Debug print
                // }, 3000)
            })
        }
    }

    socket.onerror = function(error) {
        console.error("WebSocket error:", error);
    }
};



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


    // // No Longer used, using WebSockets communication, not HTTP Request /// This was part of request_render() function
    // // Generete fetch URL
    // const url = `request_render/?x=${x}&y=${y}&zoom=${zoom}&max_iterations=${max_iterations}`;
    // try {
    //     const response = await fetch(url);
    //     if (!response.ok) {
    //         throw new Error("Failed to generate image");
    //     }

    //     const blob = await response.blob();

    //     const link = document.createElement("a");
    //     link.href = URL.createObjectURL(blob);
    //     link.download = "generated_image.jpg"
    //     link.innerText = "generated_image.jpg"

    //     // Append link to link placeholder div, clearing any previous links first
    //     const linkPlaceholder = document.getElementById("link-placeholder")
    //     linkPlaceholder.innerHTML = "";
    //     linkPlaceholder.appendChild(link);

    //     // Activate modal
    //     const saveRenderButton = document.getElementById("save-render-button")
    //     saveRenderButton.click();

    //     // Once link is clicked - deactivate modal
    //     const cancelRenderButton = document.getElementById("cancel-render-button")
    //     link.addEventListener("click", () => {
    //         cancelRenderButton.click()
    //     })

    // } catch (error) {
    //     console.error(error);
    // } finally {
    //     button.innerText = "Request Render";
    //     button.disabled = false;
    // }



