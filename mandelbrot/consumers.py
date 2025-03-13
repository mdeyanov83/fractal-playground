import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer


class MandelbrotProgressConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """ Accept WebSocket connection. """
        self.user_channel_name = self.scope.get('user_channel_name', None)
        if not self.user_channel_name:
            self.user_channel_name = str(self.channel_name)  # Use channel_name as fallback
        await self.accept()

    async def disconnect(self, close_code):
        """ Handle WebSocket disconnection. """
        pass  # Nothing special needed on disconnect

    async def receive(self, text_data):
        """ Receive a message from WebSocket (e.g. start rendering) """
        data = json.loads(text_data)

        if data["type"] == "start_render":
            # Trigger the render process with the passed parameters
            x = data.get("x", -0.7)
            y = data.get("y", 0)
            zoom = data.get("zoom", 1)
            max_iterations = data.get("max_iterations", 150)

            # Start rendering and pass the current WebSocket consumer
            await self.start_render(x, y, zoom, max_iterations)

    async def start_render(self, x, y, zoom, max_iterations):
        """ Initiate the rendering process on the backend """
        from .utils import request_render
        # Call the request_render() view manually with the consumer passed as an argument
        await request_render(x, y, zoom, max_iterations, user_consumer=self)

    async def send_progress(self, progress):
        """ Send progress update to the front end. """
        await self.send(text_data=json.dumps({
            "type": "progress_update",
            "progress": progress,
        }))

    async def send_image(self, image_bytes):
        """ Send image binary data to the front end. """
        # print("Sending image binary data.")  # Debug print
        await self.send(bytes_data=image_bytes)
