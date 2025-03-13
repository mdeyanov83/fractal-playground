document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", function(event) {

            let view_id = event.target.dataset.view_id
            if (!view_id) {
                console.error("Error: no view_id found.");
                return;
            }
            const csrftoken = document.querySelector("meta[name='csrf-token']").getAttribute("content");

            fetch("/delete_mandelbrot_view", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrftoken,
                },
                body: JSON.stringify({
                    view_id: view_id,
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result.error) {
                    // Handle error
                    console.log(`Error: ${result.error}`);
                } else {
                    // Print confirmation to console
                    console.log(result.message);
                    event.target.closest(".saved-view-item").remove(); // Remove the parent element
                }
            })
            .catch(error => console.error("Fetch error:", error)); // Handle network errors
        });
    });
});

