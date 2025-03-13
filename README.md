# Fractal Playground - a real time Mandelbrot and Julia sets visualizer

## Description and Instructions
Fractal Playground is an online real-time interactive Mandelbrot set and corresponding Julia set visualizer with a few additional cool features.

The main page consists of a navigation bar, 2 visuzalizer windows rendering the Mandelbrot and Julia sets and a control panel.

The navigation bar allows the user to view predefined Popular views or saved user Favorite views.

The control panel has input sliders for the max iterations limit on both sets, displays information about the current Mandelbrot view (coordinates, zoom and iteration count at mouse pointer) as well as buttons __Save View__ for saving the current view in Favorite Views and __Request Render__ for rendering a higher resolution, more detailed (especially in deeper zoom levels) image with the currently viewed coordinates, zoom and iteration level. The image is rendered on the backend server and can be saved as a JPEG once ready.

Backend rendering is done asynchronously and both the user interface and the server remain responsive for fractal interaction as well as reqeusts (like saving a Favorite view)

The Mandelbrot window supports pan and zoom the mouse (Desktop) and drag and pinch on a touch screen (Mobile).

The Julia window renders the corresponding Julia set at the mouse pointer coordinates (if mouse cursor is over the Mandelbrot window) or at the center coordintates (if mouse cursor is outside it).

The User profile page allows the user to delete any previously saved Favorite views.

For full functionality please register an account and log in.

## Distinctiveness and Complexity
...as well as design choices

Generally, the whole project was meant to be a learning excercie, therefore the complexity and design choices were a result of trying and learning new concepts/technologies (althrough realistically just barely scratching the surface). I wanted to get a taste of new and interesting concepts, rather than making an application overly complex by repeating the same functionality over and over.

Please see below the different technologies that were used, their implementation and reasoning.

__Front End (Clent Side)__

- WebGL2

The rendering windows use HTML5 Canvas elements / WebGL2 context (vertex and fragment shaders) for rendering the fractals using the client side GPU. In this case WebGL2 has the limitation of lacking 64-bit double-precision floating-point numbers, which limits the zoom levels to ~10^6. Using WebGPU instead (which natively supports double-precision) is a solution, but it is not widely supported by all browsers yet. Rendering could easily be done in software (on the CPU) which would allow for a much deeper zoom levels using double-precision floating point, however the idea was to try GPU rendering.

- WebSockets

I wanted the user to receive live progress updates when they request a rendered image from the backend. When the user clicks the __Reqeust Render__ button in the control pannel, a WebSocket connection is established with the server. Live updates are send to the front-end and a progress bar is visualized. Once the image is ready, the server transmits the binary image data through the same connection and a window pops up so the user can save the image locally.

__Back End (Server Side)__

The backend is a Django based application serving the HTML templates and JavaScript code necessary for real-time rendering the fractals on the clinet side. Additionally, the backend provides the option to asynchronously render a higher resolution and higher detail image of the Mandelbrot set based on client-side provided parameters.

- NumPy

Instead of iterating over each pixel in the requested image individually, the NumPy library is used for performance-optimized calculation using NP arrays, a 2D grid of complex numbers (coordinates mapped to each pixel for the requested image) and vectorized operations to avoid looping over each pixel. The result is a matrix of escape values (iterations) which is used to map to a colormap and generate the image.

- Matplotlib

The Matplotlib library is used for its predefined colormaps so a more interesing a visually colorful image can be generated.

- Django Channels

Django Channels is used for WebSocket support. It allows the backend to handle not only HTTP reqeusts, but also WebSockets connection for sending live updates to the client side during the render process.

- Daphne Server

Dahphne server is used to handle support for ASGI applications such as Channels in this case.

## Project Structure / Files

- **fractal_playground/**
    - **fractal_playground/**
        - \_\_init\_\_.py
        - asgy.py - ASGI configuration
        - settings.py - Django project settings
        - urls.py - URL project configration
        - wsgi.py - WSGI project configuration (prior to implementing Daphne ASGI for Channels). Currently not used, both HTTP and WebSockets connections are handled by Daphne via ASGI

    - **mandelbrot/**
        - **migrations/** - Django migrations folder
        - **static/**
            - **mandelbrot/**
                - **old/** - backup folder before implementing major changes / rewrite to the code.
                - main.js - Main rendering functionality. Contains JavaScript code for rendering the 2 WebGL2 canvas elements, creating vertex and fragment shaders, creating buffers, gl programs and execution. Also Zoom and Pan functionality and control panel functions.
                - secondary.js - Secondary JS functionality - Loading saved views (popular, favorite), handling Render requests to the back end, progress updates and Saving user view requests to the backend databse.
                - styles.css - Custom CSS styles.
                - user_profile.js - JS code to handle deletion of previously saved user views on the User profile page.
            - favicon.ico

        - **templates/**
            - **mandelbrot/**
                - index.html - Main index page (extends layout.html) - Contains CANVAS render elements and control panel.
                - layout.html - Main page layout. Contains META tags, Bootstrap import links for CS and JS and custom stylessheet and the main Navigation Bar.
                - login.html - Login template
                - register.html - Register template
                - user_profile.html - User profile template
        - \_\_init\_\_.py
        - admin.py - Admin panel model registration and configuration
        - apps.py
        - consumers.py - WebSocket consumers
        - models.py - Custom Django models
        - routing.py - WebSocket URL patterns configuration
        - test.py
        - urls.py - URL routes for pages and APIs (based on HTTP requests)
        - utils.py - Mandelbrot calculation and call functions used by the Websocket consumer.
        - views.py - All django View functions handling HTTP requests and responses.

    - db.sqlite3 - User data and saved Mandelbrot views database
    - manage.py
    - README.md - This file.
    - requirements.txt - Required packages and dependencies.

## Requirements

Required packages:
- channels
- daphne
- numpy
- pillow
- websockets

## How to run

To run the application simply use:
- __python manage.py runserver__

 !!! Notes !!!
- Daphne server could be used to handle both http request/respons and websockets, however it does not serve static files by default. In order to serve static files there are a number of methods (installing Whitenoise and using collectstatic, using Nginx/Apache server to serve static files, etc.)
- Alternatively both Runserver and Daphne could be run on different ports in separate terminals
    - python manage.py runserver 0.0.0.0:8080
    - daphne -b 0.0.0.0 -p 8000 fractal_playground.asgi:application

- For my use case the simplest way was to modify settings.py (add Daphne as installed app and configure ASGI_APPLICATION) and then run the application via just RUNSERVER

INSTALLED_APPS = [
    'daphne',  # Add this to enable ASGI
    'channels',
    'fractal_playground',
]
ASGI_APPLICATION = "fractal_playground.asgi.application"

## Known limitations and considerations

- Remnants of old, commented-out code which was rewritten for optimization/functionality was left on purpose for my own reference.

- Zoom level is limited (hard-coded) to 10^6 due to limiatations of WebGL2 itself. WebGl2 only supports 32-bit (highp) floating-point numbers and lacks support for 64-bit (double-precision). Could be increased via MAX_ZOOM constant in main.js, however deeper zooms are just a pixelated mess due to the reasons above.
- Max iterations is limitted to 1500 (Mandelbrot) and 150 (Julia) due to performance considerations on lower-end hardware. Could be increased via MAX_ITERS_MAND and MAX_ITERS_JULIA constants in main.js
- Pan functionality - During panning, the effective rendering resolution of the Mandelbrot set is halved, for performance and smoother panning visuals, and once the view is static it is restored back to full res.
- The rendered image W x H  defaults to 1600 x 1200. It could be increased by adding higher resolution as arguments to the render_mandelbrot() call.
    - The backend computation algorithm in render_mandelbrot() ASSUMES a 4:3 aspect ratio and any other will result in a distorted image. Aspect ratio factor could be implemented in future versions.
- Matplotlib colormap is also hardcoded as default value (seismic) in the render_mandelbrot() definition parameters. Other colormaps could be used as arguments as above.

## Revision History
### v0.5
- Moved request_render() and render_mandelbrot() from veiws.py to utils.py as they are no longer django View functions handling HTTP requests.
- Added front-end mobile support. Canvas elements now support touch inputs - Drag-to-Pan and Pinch-to-Zoom.
- Fixed a number of UI bugs and improvements:
    - Progress bar now reaches 100%, rather than staying at 90 something % when image is ready.
    - Progress bar and Request Render button are now properly reset, when the download modal is closed (regardless if the image is saved or not).
    - Websocket connection properly closed after image is received from the server.
    - Properly revoking the image download URL and releasing memory once it is downloaded or canceled. A slight 2 second delay was added to avoid revoking the URL before the image is actually saved.
    - A few other minor things I cannot remember...

### v0.4
- Added WebSocket functionality. request_render() function was rewritten (from using HTTP request/reponse) to be called via a websocket consumer. render_mandelbrot() sends periodic progress updates to the front-end via the same consumer.
- Added progress bar for the rendering process in the control panel in index.html
- Rendering on the back-end performance optimized to use NumPy. Now uses NP 2D grid of complex numbers (coordinates) and vectorized operations to compute the Mandelbot set, rather than iterating over each pixel in the generated image.

### v0.3
- Created an HTML main layout (containing META tags, Bootstrap import links, etc. ), to be extended upon from all other templates.
- HTML expanded with templates for user registration, login, user profile page
- Added button to save user generated views. Storing metadata in the backend database.
- Added user accounts.
- Added button and functionality to generatea high resolution/high detail image on the backend (at this point called via http request/response).
- Included a bootstrap Modal in HTML, which pops up once the rendered image is ready for download.

### v0.2
- Added JS event listeners for mouse pan and zoom functionality to the Mandelbrot visuzlizer.
- Integrated into a Django project.
- Created custom models for user profiles and user saved Views.

### v0.1
- Front-end only.
- Created the basic HTML template containing 2 Canvas elements and a control panel.
- Added Error Message box on the main page for debugging JS rendering code.
- Canvas elements are configured with WebGL2 context.
- Created custom pixel and vertex shaders for visualizing the Mandelbrot and Julia sets.
- JavaScript code for creting the necessary shaders, buffers, GL program and real-time rendering the Mandelbrot and Julia sets executed on the GPU.
