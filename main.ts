import { Application, Router } from "@oak/oak";
import { verify } from "@felix/bcrypt";
import Twig from "@twig";

const WEBHOOK_URL = (() => {
    const url = Deno.env.get('WEBHOOK_URL');
    if (!url) throw new Error("Webhook URL not provided! Set the WEBHOOK_URL environment variable!");
    return url;
})();
const OWNER = (() => {
    const owner = Deno.env.get("OWNER");
    if (!owner) {
        console.warn("Owner name is not set! This controls the page branding. The default value 'someone' will be used.");
        console.warn("To change this, set the OWNER environment variable!");
        return "someone";
    }
    return owner;
})();
const PORT = (() => {
    const port = Number.parseInt(Deno.env.get("PORT") || "");   // Intentionally coerce NaN
    if (!port) {
        console.info("Using default port 8000. To change this, set the PORT environment variable!");
        return 8000;
    }
    return port;
})();

async function webhook(who: string, what: string, urgent: boolean) {
    try {
        const res = await fetch(WEBHOOK_URL as string, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ who, what, urgent })
        });
        if (res.ok) return true;
    } catch (e) {
        console.error(e);
    }
    return false;
}

const router = new Router();

router
    .get("/", async (ctx) => {
       ctx.response.body = await new Promise<string>((resolve, reject) => {
           Twig.renderFile("./index.twig",
               {
                   user: ctx.state.user,
                   owner: OWNER
               },
               (e: Error, h: string) => e ? reject(e) : resolve(h));
       });
    })
    .post("/page", async (ctx) => {
        const json = await ctx.request.body.json();
        const {what, urgent} = json;
        console.log(urgent ? '⚠' : '🛈', ctx.state.user, 'says', what);
        if (await webhook(
            ctx.state.user,
            what ?? "nothing",
            urgent ?? false
        )) {
            ctx.response.body = "ok";
        } else {
            ctx.response.body = "err";
            ctx.response.status = 500;
        }
    });

const app = new Application();
app.use(async (ctx, next) => {
    const auth = ctx.request.headers.get('Authorization');
    if (!auth || !auth.startsWith('Basic ')) {
        ctx.response.headers.set('WWW-Authenticate', 'Basic realm="Burnout\'s Pager"');
        ctx.response.status = 401;
        ctx.response.body = Deno.readFileSync("./401.html");
    } else {
        const [user, pass] = atob(auth.substring(6)).split(':');
        const hash = Deno.env.get("AUTH_" + user.toUpperCase());
        if (!hash || !await verify(pass, hash)) {
            ctx.response.headers.set('WWW-Authenticate', 'Basic realm="Burnout\'s Pager"');
            ctx.response.status = 401;
            ctx.response.body = Deno.readFileSync("./401.html");
        } else {
            ctx.state.user = user;
            await next();
        }
    }
});
app.use(router.routes());
app.use(router.allowedMethods());
app.listen({ port: PORT });
console.log("Listening on port", PORT);