import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react"
import JacdacContext, { JacdacContextProps } from "../jacdac/Context"
import { CHANGE, PROGRESS } from "../../jacdac-ts/src/jdom/constants"
import { Trace } from "../../jacdac-ts/src/jdom/trace/trace"
import { TracePlayer } from "../../jacdac-ts/src/jdom/trace/traceplayer"
import { TraceRecorder } from "../../jacdac-ts/src/jdom/trace/tracerecorder"
import { TraceView } from "../../jacdac-ts/src/jdom/trace/traceview"
import useLocalStorage from "./hooks/useLocalStorage"

export interface PacketsProps {
    view: TraceView
    clearPackets: () => void
    clearBus: () => void
    filter: string
    setFilter: (filter: string) => void
    replayTrace: Trace
    setReplayTrace: (trace: Trace) => void
    recording: boolean
    toggleRecording: () => void
    tracing: boolean
    toggleTracing: () => void
    paused: boolean
    setPaused: (p: boolean) => void
    setSilent: (p: boolean) => void
    timeRange: number[] // [start, end]
    toggleTimeRange: () => void
    setTimeRange: (range: number[]) => void
    player: TracePlayer
}

const PacketsContext = createContext<PacketsProps>({
    view: undefined,
    clearPackets: () => {},
    clearBus: () => {},
    filter: "",
    setFilter: () => {},
    replayTrace: undefined,
    setReplayTrace: () => {},
    recording: false,
    toggleRecording: () => {},
    tracing: false,
    toggleTracing: () => {},
    paused: false,
    setPaused: () => {},
    setSilent: () => {},
    timeRange: undefined,
    toggleTimeRange: () => {},
    setTimeRange: () => {},
    player: undefined,
})
PacketsContext.displayName = "packets"

export default PacketsContext

const DEFAULT_PACKET_FILTER = "announce:false reset-in:false min-priority:false"

// eslint-disable-next-line react/prop-types
export const PacketsProvider = ({ children }) => {
    const { bus } = useContext<JacdacContextProps>(JacdacContext)
    const [filter, _setFilter] = useLocalStorage(
        "packetfilter",
        DEFAULT_PACKET_FILTER
    )

    const recorder = useRef<TraceRecorder>(new TraceRecorder(bus))
    const view = useRef<TraceView>(new TraceView(bus, filter))
    const player = useRef<TracePlayer>(new TracePlayer(bus))

    const [timeRange, setTimeRange] = useState<number[]>(undefined)
    const [recording, setRecording] = useState(false)
    const [replayTrace, _setReplayTrace] = useState<Trace>(undefined)
    const [tracing, setTracing] = useState(false)
    const [paused, _setPaused] = useState(false)
    const [silent, _setSilent] = useState(false)

    const clearPackets = () => {
        setTimeRange(undefined)
        player.current.stop()
        recorder.current.stop()
        view.current.clear()
        // don't clear the bus, it's too disrupting
        //bus.clear();
    }
    const clearBus = () => {
        clearPackets()
        bus.clear()
    }
    const setReplayTrace = async (trace: Trace) => {
        clearPackets()
        player.current.trace = trace
    }
    const toggleRecording = () => {
        if (recorder.current.recording) {
            player.current.trace = recorder.current.stop()
        } else {
            recorder.current.start()
            player.current.trace = undefined
        }
    }
    const toggleTracing = async () => {
        console.log(`player toggle running ${player.current.running}`)
        if (player.current.running) {
            player.current.stop()
        } else {
            clearPackets()
            bus.clear() // clear all devices
            player.current.start()
        }
    }
    const toggleTimeRange = () => {
        if (timeRange) {
            setTimeRange(undefined)
        } else {
            setTimeRange([
                view.current.trace.startTimestamp,
                view.current.trace.endTimestamp,
            ])
        }
    }
    const setFilter = (f: string) => {
        _setFilter(f)
    }
    const setPaused = (p: boolean) => {
        if (p !== paused) {
            _setPaused(p)
            view.current.paused = p
        }
    }
    const setSilent = (p: boolean) => {
        if (p !== silent) {
            _setSilent(p)
            view.current.silent = p
        }
    }
    // views
    useEffect(() => {
        recorder.current.mount(
            recorder.current.subscribe(CHANGE, () => {
                setRecording(recorder.current.recording)
            })
        )
        player.current.mount(
            player.current.subscribe(CHANGE, async () => {
                setTracing(player.current.running)
                _setReplayTrace(player.current.trace)
                if (player.current.trace) await bus.stop()
                else {
                    if (!recorder.current.trace) bus.clear()
                    await bus.start()
                }
            })
        )
        return () => {
            recorder.current.unmount()
            view.current.unmount()
            player.current.unmount()
        }
    }, [])
    // update filter in the view
    useEffect(() => {
        let f = filter
        if (timeRange?.[0] !== undefined) f += ` after:${timeRange[0]}`
        if (timeRange?.[1] !== undefined) f += ` before:${timeRange[1]}`
        view.current.filter = f
    }, [filter, timeRange])

    return (
        <PacketsContext.Provider
            value={{
                view: view.current,
                clearPackets,
                clearBus,
                filter,
                setFilter,
                replayTrace,
                setReplayTrace,
                recording,
                toggleRecording,
                tracing,
                toggleTracing,
                paused,
                setPaused,
                setSilent,
                player: player.current,
                timeRange,
                setTimeRange,
                toggleTimeRange,
            }}
        >
            {children}
        </PacketsContext.Provider>
    )
}
