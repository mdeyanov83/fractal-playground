import asyncio
import numpy as np
import io

from PIL import Image
import matplotlib.pyplot as plt


# @login_required
async def request_render(x, y, zoom, max_iterations, user_consumer=None):
    """
    Asynchronously calls render_mandelbrot() and sends the rendered image
    as JPEG binary data to the front end via WebSocket.

    Args:
        x, y (float): Center of the Mandelbrot set.
        zoom (float): Zoom level.
        max_iterations (int): Maximum iterations for the escape algorithm.
        width, height (int); Image dimensions.
        user_consumer (WebSocket): WebSocket instance.

    Returns:
        None
    """

    # No longer used, parameters passed from the WebSocket consumer
    # # Get parameters from GET request
    # try:
    #     x = float(request.GET.get("x", -0.7))
    #     y = float(request.GET.get("y", 0))
    #     zoom = float(request.GET.get("zoom", 1))
    #     max_iterations = int(request.GET.get("max_iterations", 150))
    # except ValueError:
    #     return HttpResponse("Invalid parameters", status=400)

    # Generate the image asynchronously
    # Passing only the consumer send_progress() method to the rendering function
    img = await render_mandelbrot(x, y, zoom, max_iterations, send_progress=user_consumer.send_progress)

    # Save iamge to an in-memory file
    img_io = io.BytesIO()
    img.save(img_io, format="JPEG", quality=85)  # Save as JPEG
    img_io.seek(0)

    # No longer used, image data is sent via WebSocket, not through a HTTP response
    # # Return the image as a response
    # response = HttpResponse(img_io, content_type="image/jpeg")
    # response["Content-Disposition"] = 'attachment; filename="generated_image.jpg"'
    # return response

    # Return image as binary data via WebSocket
    await user_consumer.send_image(img_io.getvalue())
    return


# Generate the Mandelbrot set using NumPy for performance optimization
# Send progress updates via WebSocket
# @login_required
async def render_mandelbrot(x, y, zoom, max_iterations, width=1600, height=1200, cmap="seismic", send_progress=None):
    """
    Asynchronously render a Mandelbrot set
    Send progress updates via WebSocket

    Args:
        x, y (float): Center of the Mandelbrot set.
        zoom (float): Zoom level.
        max_iterations (int): Maximum iterations for the escape algorithm.
        width, height (int); Image dimensions.
        cmap (str): Matplotlib colormap name
        send_progress (method): WebSocket method for sending progress updates to the frontend

    Returns:
        PIL Image in RGB mode.
    """

    # Map pixel coordinates to the complex plane
    # Usually X (real part) spans from -2.0 to 2.0 and Y (imaginary) from -1.5 to 1.5
    xmin, xmax = x - 2.0 / zoom, x + 2.0 / zoom
    ymin, ymax = y - 1.5 / zoom, y + 1.5 / zoom

    # Create a grid of complex numbers
    real = np.linspace(xmin, xmax, width)
    imag = np.linspace(ymax, ymin, height)[:, np.newaxis]
    c = real + 1j * imag

    # Initialize Z and iteration count
    z = np.zeros_like(c, dtype=np.complex128)
    escape_time = np.zeros(c.shape, dtype=int)

    # Create mask for escaped points
    mask = np.ones(c.shape, dtype=bool)

    # Mandelbrot set iteration using NumPy
    for i in range(max_iterations):
        z[mask] = z[mask] * z[mask] + c[mask]  # Vectorized computation
        mask = np.abs(z) < 2  # Update mask for escaped points
        escape_time[mask] = i  # Store iteration count

        # Every 10 iterations, yield control to event loop to allow handling of other tasks
        # Send progress updates every 10 iterations
        if i % 10 == 0 and send_progress:
            # print(i)  # Debug print

            progress = int((i / max_iterations) * 100)
            await send_progress(progress)
            await asyncio.sleep(0)  # Yield control to the event loop

    # print("calculation complete")  # Debug print

    # Manually send 100% progress update once render is complete for visually appealing 100% status bar
    await send_progress(100)

    # Colormap using matplotlib colormaps (colormap is hardcoded in the function arguments, use some of the diverging colormaps for nicer effect)
    norm_escape = escape_time / max_iterations
    colormap = plt.get_cmap(cmap)
    colored_array = (colormap(norm_escape)[:, :, :3] * 255).astype(np.uint8)
    img = Image.fromarray(colored_array, mode="RGB")
    return img

    # # Normalize values to 0-255 grayscale
    # escape_time = (255 * escape_time / max_iterations).astype(np.uint8)
    # # Create and return the image
    # img = Image.fromarray(escape_time, mode="L")  # "L" mode = grayscale
    # return img


# Before implementing NumPy calculations
# Determine the iterations before a point escapes (for color gradient)
# def get_iterations(c, max_iterations):
#     z = 0
#     for n in range(max_iterations):
#         if abs(z) > 2:
#             return n
#         z = z*z + c
#     return max_iterations  # Means the point is inside the set


# Before implementing NumPy calculations
# Generate the Mandelbrot fractal based on x, y, zoom and max iterations
# async def render_mandelbrot(x, y, zoom, max_iterations, width=800, height=600):

#     # Map pixel coordinates to the complex plane
#     xmin = x - 2.0 / zoom
#     xmax = x + 2.0 / zoom
#     ymin = y - 1.5 / zoom
#     ymax = y + 1.5 / zoom

#     # Create an empty image
#     img = Image.new("RGB", (width, height))
#     pixels = img.load()

#     for px in range(width):
#         for py in range(height):
#             # Convert pixel coordinates to complex number
#             real = xmin + (px / width) * (xmax - xmin)
#             imag = ymax - (py / height) * (ymax - ymin)
#             c = complex(real, imag)

#             # Compute Mandelbrot iterations
#             color = get_iterations(c, max_iterations)

#             # Map colors to a grayscale gradient
#             color_value = int(255 * (color / max_iterations))
#             pixels[px, py] = (color_value, color_value, color_value)  # Grayscale

#     return img
