# Pager
A simple web frontend to send a simple webhook payload.

## What does it do?
The default configuration will serve an HTML page on port `8000` with basic
authentication. This page contains a form that allows the user to specify a
message and whether the message is urgent. The page will then send the
following payload to the specified `WEBHOOK_URL`, proxied through the machine
hosting the app:

```json5
{
  "who": "user",  // set based on authentication
  "what": "msg",  // set based on form value
  "urgent": false // set based on form value
}
```

## What can I customize?
The following environment variables can be used to tweak the behavior:

| Environment Variable | Default Value | Description                                                                                                                                                  |
|----------------------|---------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| WEBHOOK_URL          | [required]    | The URL to send the payload to.                                                                                                                              |
| OWNER                | `Someone`     | The name to be used for pager branding.                                                                                                                      |
| PORT                 | `8000`        | The port that will host the app.<br/>***Note:** the provided Docker container only exposes the default port. You will need to manually expose a custom one!* |
| AUTH_*user*          | none          | Supply a bcrypt password for the specified user.                                                                                                             |

## How do I set it up?
From cloning the repo and running it locally:
```shell
deno run --unstable-ffi --allow-ffi --allow-env --allow-net --allow-read main.ts
```
From deploying the Docker container in a stack:
```yaml
services:
  pager:
    image: ghcr.io/ndm13/pager:latest
    environment:
      # Be sure to escape dollar signs in compose files with $$
      - AUTH_USER=$$2a$$10$$nZEAP/Mmwkao9vrILikDH.SI1qxGQA/wRM4oqWU.jW4s.3sQvvkAO
      - OWNER=Owner
      - WEBHOOK_URL=$WEBHOOK
    restart: unless-stopped
```

## What receives this?
Whatever you want! Personally, I'm using this with [Home Assistant](https://www.home-assistant.io/)
to send notifications to my phone, so specific people can get urgent messages
to me when I'm behind Do Not Disturb, Focus Mode, or Bedtime Mode. But it can
be used for any recipient that can handle that JSON object. Keep in mind that
it's the *server* sending the webhook request, not the *client!*