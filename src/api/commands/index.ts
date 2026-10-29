import { after, instead } from "@api/patcher";
import { logger } from "@lib/utils/logger";
import { commands as commandsModule, messageUtil } from "@metro/common";

import { ApplicationCommand, ApplicationCommandInputType, ApplicationCommandType, RainApplicationCommand } from "./types";

let commands: ApplicationCommand[] = [];
const patches = new Set<() => void>();

export function patchCommands() {
    const unpatchGetBuiltInCommands = after("getBuiltInCommands", commandsModule, (args, res) => {
        const commandType = args[0];

        return res.concat(
            commands.filter(c => {
                if (Array.isArray(commandType)) {
                    return commandType.includes(c.type);
                }
                return c.type === commandType;
            }).filter(c => {
                return !c.__rain?.shouldHide || !c.__rain.shouldHide();
            })
        );
    });

    patches.add(unpatchGetBuiltInCommands);
}

export function registerCommand(command: RainApplicationCommand): () => void {
    // Get built in commands
    let builtInCommands: ApplicationCommand[];
    try {
        builtInCommands = commandsModule.getBuiltInCommands(ApplicationCommandType.CHAT, true, false);
    } catch {
        builtInCommands = commandsModule.getBuiltInCommands(Object.values(ApplicationCommandType), true, false);
    }

    const ids = [...builtInCommands, ...commands].map(command => Number(command.id)).filter(Number.isFinite);
    command.id = String(Math.min(-1, ...ids) - 1);

    // Fill optional args
    command.__rain = {
        shouldHide: command.shouldHide
    };
    command.applicationId ??= "-1";
    command.type ??= ApplicationCommandType.CHAT;
    command.inputType = ApplicationCommandInputType.BUILT_IN;
    command.displayName ??= command.name;
    command.untranslatedName ??= command.name;
    command.displayDescription ??= command.description;
    command.untranslatedDescription ??= command.description;

    if (command.options) for (const opt of command.options) {
        opt.displayName ??= opt.name;
        opt.displayDescription ??= opt.description;
    }

    instead("execute", command, (args, orig) => {
        return Promise.resolve().then(() => orig.apply(command, args)).then(ret => {
            if (ret && typeof ret === "object") {
                messageUtil.sendMessage(args[1].channel.id, ret);
            }
        }).catch(err => {
            logger.error("Failed to execute command", err);
        });
    });

    // Add it to the commands array
    commands.push(command);

    // Return command id so it can be unregistered
    return () => (commands = commands.filter(({ id }) => id !== command.id));
}
