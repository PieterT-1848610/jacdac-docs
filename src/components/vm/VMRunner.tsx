import React, { MutableRefObject, useContext, useEffect, useState } from "react"
import { Button, Chip, Grid, Tooltip, Typography } from "@material-ui/core"
// tslint:disable-next-line: match-default-export-name no-submodule-imports
import { IT4Program } from "../../../jacdac-ts/src/vm/ir"
import {
    IT4ProgramRunner,
    TraceContext,
    VMStatus,
} from "../../../jacdac-ts/src/vm/vmrunner"
import useChange from "../../jacdac/useChange"
import PlayArrowIcon from "@material-ui/icons/PlayArrow"
import JacdacContext, { JacdacContextProps } from "../../jacdac/Context"
import StopIcon from "@material-ui/icons/Stop"
import DeviceAvatar from "../devices/DeviceAvatar"
import { serviceSpecificationFromName } from "../../../jacdac-ts/src/jdom/spec"
import { JDService } from "../../../jacdac-ts/src/jdom/service"
import {
    addServiceProvider,
    serviceProviderDefinitionFromServiceClass,
} from "../../../jacdac-ts/src/servers/servers"
import AddIcon from "@material-ui/icons/Add"
import AppContext from "../AppContext"
import { ERROR, TRACE } from "../../../jacdac-ts/src/jdom/constants"
import { string } from "prop-types"

export default function VMRunner(props: {
    program: IT4Program
    autoStart?: boolean
    runnerRef?: MutableRefObject<IT4ProgramRunner>
}) {
    const { program, autoStart: autoStartDefault, runnerRef } = props
    const { bus } = useContext<JacdacContextProps>(JacdacContext)
    const { setError } = useContext(AppContext)
    const [testRunner, setTestRunner] = useState<IT4ProgramRunner>()
    const [autoStart, setAutoStart] = useState(!!autoStartDefault)

    // create runner
    useEffect(() => {
        const runner = program && new IT4ProgramRunner(program, bus)
        setTestRunner(runner)
        if (runner && runnerRef) runnerRef.current = runner
        if (runner && autoStart) runner.start()
        return () => {
            runner?.cancel()
            runnerRef.current = undefined
        }
    }, [program, autoStart])

    // errors
    useEffect(() => testRunner?.subscribe(ERROR, e => setError(e)))
    // traces
    const handleTrace = (value: { message: string; context: TraceContext }) => {
        const { message, context } = value
        console.debug(`vm> ${message}`, context)
    }
    useEffect(() =>
        testRunner?.subscribe<{ message: string; context: TraceContext }>(
            TRACE,
            handleTrace
        )
    )

    const disabled = !testRunner
    const status = useChange(testRunner, t => t?.status)
    const handleRun = () => {
        setAutoStart(autoStartDefault)
        try {
            testRunner.start()
        } catch (e) {
            console.debug(e)
        }
    }
    const handleCancel = () => {
        setAutoStart(false)
        testRunner.cancel()
    }
    const running = status === VMStatus.Running
    const roles = useChange(runnerRef.current, _ => {
        const r = _?.roles
        if (r) console.debug(`vm roles`, { roles: r })
        return r
    })

    const handleRoleClick =
        (role: string, service: JDService, specification: jdspec.ServiceSpec) =>
        () => {
            if (!service && specification) {
                addServiceProvider(
                    bus,
                    serviceProviderDefinitionFromServiceClass(
                        specification.classIdentifier
                    )
                )
            } else {
                // do nothing
            }
        }

    return (
        <Grid container spacing={1}>
            <Grid item>
                <Button
                    disabled={disabled}
                    variant="contained"
                    onClick={running ? handleCancel : handleRun}
                    color={running ? "default" : "primary"}
                    startIcon={running ? <StopIcon /> : <PlayArrowIcon />}
                >
                    {running ? "Stop" : "Run"}
                </Button>
            </Grid>
            {roles &&
                Object.keys(roles)
                    .map(role => ({
                        role,
                        service: roles[role].service,
                        specification: serviceSpecificationFromName(
                            roles[role].shortName
                        ),
                    }))
                    .map(({ role, service, specification }) => (
                        <Grid item key={role}>
                            <Tooltip
                                title={
                                    service
                                        ? `bound to ${service.device.friendlyName}`
                                        : `start ${specification.name} simulator`
                                }
                            >
                                <Chip
                                    label={role}
                                    variant={service ? "default" : "outlined"}
                                    avatar={
                                        service ? (
                                            <DeviceAvatar
                                                device={service.device}
                                            />
                                        ) : (
                                            <AddIcon />
                                        )
                                    }
                                    onClick={handleRoleClick(
                                        role,
                                        service,
                                        specification
                                    )}
                                />
                            </Tooltip>
                        </Grid>
                    ))}
        </Grid>
    )
}
