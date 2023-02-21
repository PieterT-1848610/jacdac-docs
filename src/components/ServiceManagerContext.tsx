import React, { createContext, useCallback, useContext, useRef } from "react"
import { JSONTryParse } from "../../jacdac-ts/src/jdom/utils"
import {
    BrowserFileStorage,
    HostedFileStorage,
    FileStorage,
} from "../../jacdac-ts/src/embed/filestorage"
import {
    EmbedMessage,
    EmbedSpecsMessage,
    EmbedThemeMessage,
} from "../../jacdac-ts/src/embed/protocol"
import {
    ModelStore,
    HostedModelStore,
} from "../../jacdac-ts/src/embed/modelstore"
import { IFrameTransport } from "../../jacdac-ts/src/embed/transport"
import DarkModeContext from "./ui/DarkModeContext"
import JacdacContext, { JacdacContextProps } from "../jacdac/Context"
import { UIFlags } from "../jacdac/providerbus"
import useWindowEvent from "./hooks/useWindowEvent"

export interface ISettings {
    get(key: string): string
    set(key: string, value: string): void
    clear(): void
}

export class LocalStorageSettings implements ISettings {
    private live: Record<string, string>
    constructor(private readonly key: string) {
        this.live =
            JSONTryParse<Record<string, string>>(
                typeof self !== "undefined" && self.localStorage.getItem(key)
            ) || {}
    }
    get(key: string): string {
        return this.live[key]
    }
    set(key: string, value: string): void {
        if (value === undefined || value === null) delete this.live[key]
        else this.live[key] = value
        if (typeof self !== "undefined")
            self.localStorage.setItem(
                this.key,
                JSON.stringify(this.live, null, 2)
            )
    }
    clear() {
        this.live = {}
        if (typeof self !== "undefined") self.localStorage.removeItem(this.key)
    }
}

export interface ServiceManagerContextProps {
    isHosted: boolean
    fileStorage: FileStorage
    modelStore: ModelStore
}

const ServiceManagerContext = createContext<ServiceManagerContextProps>({
    isHosted: false,
    fileStorage: null,
    modelStore: null,
})
ServiceManagerContext.displayName = "Services"

export default ServiceManagerContext

// eslint-disable-next-line react/prop-types
export const ServiceManagerProvider = ({ children }) => {
    const { toggleDarkMode } = useContext(DarkModeContext)
    const { bus } = useContext<JacdacContextProps>(JacdacContext)
    const propsRef = useRef<ServiceManagerContextProps>(createProps())

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMessage = useCallback(
        (ev: MessageEvent<EmbedMessage>) => {
            const msg = ev.data
            if (msg?.source !== "jacdac") return
            switch (msg.type) {
                case "theme": {
                    const themeMsg = msg as EmbedThemeMessage
                    toggleDarkMode(themeMsg.data.type)
                    break
                }
                case "specs": {
                    const specMsg = msg as EmbedSpecsMessage
                    const { services } = specMsg.data
                    bus.setCustomServiceSpecifications(services)
                    break
                }
            }
        },
        [toggleDarkMode]
    )

    useWindowEvent("message", handleMessage)
    return (
        <ServiceManagerContext.Provider value={propsRef.current}>
            {children}
        </ServiceManagerContext.Provider>
    )

    function createProps(): ServiceManagerContextProps {
        const isHosted = UIFlags.hosted
        let fileStorage: FileStorage = new BrowserFileStorage()
        let modelStore: ModelStore = undefined
        if (isHosted) {
            console.log(`starting hosted services`)
            const transport = new IFrameTransport(bus.parentOrigin)
            fileStorage = new HostedFileStorage(transport)
            modelStore = new HostedModelStore(transport)

            // notify host that we are ready
            transport.postReady()
        }
        return {
            isHosted,
            fileStorage,
            modelStore,
        }
    }
}
