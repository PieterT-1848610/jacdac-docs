// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../jacdac-ts/jacdac-spec/spectool/jdspec.d.ts" />
import { prettyUnit } from "../../../jacdac-ts/src/jdom/pretty"
import useLocalStorage from "../hooks/useLocalStorage"

const adapters: Record<string, Record<string, (v: number) => number>> = {
    "°C": {
        "°C": v => v,
        "°F": v => (9 / 5) * v + 32,
    },
    "/": {
        "/": v => v,
        "%": v => v * 100,
    },
    A: {
        A: v => v,
        mA: v => 1000 * v,
    },
}
const inverters: Record<string, Record<string, (v: number) => number>> = {
    "°F": {
        "°C": v => ((v - 32) * 5) / 9,
    },
    "%": {
        "/": v => v / 100,
    },
    mA: {
        A: v => v / 1000,
    },
}

export function useUnitConverters() {
    const [settings, setSettings] = useLocalStorage("jacdac:unitconverters", {})
    return {
        converters: Object.keys(adapters).map(unit => ({
            unit,
            name: settings[unit] || unit,
            names: Object.keys(adapters[unit]),
        })),
        setConverter: (unit: string, name: string) => {
            const newSettings = { ...settings }
            newSettings[unit] = name
            setSettings(newSettings)
        },
    }
}
const identity = (v: number) => v

export default function useUnitConverter(unit: jdspec.Unit | string): {
    name?: string
    converter: (v: number) => number
    inverter: (v: number) => number
    names?: string[]
} {
    if (!unit)
        return {
            converter: v => v,
            inverter: v => v,
        }

    const [settings] = useLocalStorage("jacdac:unitconverters", {
        "/": "%",
    })

    const adapter = adapters[unit]
    if (!adapter)
        return {
            name: prettyUnit(unit),
            converter: v => v,
            inverter: v => v,
        }

    const names = Object.keys(adapter)
    const name = settings[unit] || names[0]
    const converter = adapter[name] || identity
    const inverter = inverters[name]?.[unit] || identity

    return {
        name,
        converter,
        inverter,
        names,
    }
}
