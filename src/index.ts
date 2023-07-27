import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";

import { CommandHandler, client } from "./Exports.js";
import {REST, Routes} from "discord.js";

(await import("dotenv")).config({path: ".Env"});

function getFilesRecursively(path: string): Array<string> {
    const files: Array<string> = [];
    for (const item of fs.readdirSync(path)) {
        if (fs.statSync(`${path}\\${item}`).isDirectory()) files.push(...getFilesRecursively(`${path}\\${item}`));
        else files.push(`${path}\\${item}`);
    }
    return files;
}

for (const event of getFilesRecursively(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "Events")).filter(e => e.endsWith(".js"))) {
    const eventArr: Array<string> = event.split('\\');
    client.on(eventArr[eventArr.length - 1].substring(0, eventArr[eventArr.length - 1].length - 3), async (...args: any) => await (await import(`file:///${event}`)).default(...args));
}

for (const commandIteration of getFilesRecursively(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "Commands")).filter(e => e.endsWith(".js"))) {
    const command: any = new (await import(`file:///${commandIteration.replace(/\.ts/gmi, ".js")}`)).default();
    if (command instanceof CommandHandler)
        client.commands.set(command.data.name, command);
}

await new REST({version: "10"}).setToken(process.env.TOKEN!)
    .put(Routes.applicationCommands(process.env.APPID!), {body: client.commands.map(c => c.data.toJSON())});

await client.login(process.env.TOKEN);
