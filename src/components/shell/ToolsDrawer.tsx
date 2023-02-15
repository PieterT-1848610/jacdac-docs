import React, { useContext } from "react"
import { styled } from "@mui/material/styles"
import {
    Drawer,
    List,
    ListItemIcon,
    ListItemText,
    ListItem,
    Divider,
} from "@mui/material"
import { IconButton, Link, ListItemButton } from "gatsby-theme-material-ui"
import {
    MOBILE_BREAKPOINT,
    MOBILE_TOOLS_DRAWER_WIDTH,
    TOOLS_DRAWER_WIDTH,
} from "../layout"
import AppContext from "../AppContext"
import { useUnitConverters } from "../ui/useUnitConverter"
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import SettingsBrightnessIcon from "@mui/icons-material/SettingsBrightness"
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt"
// tslint:disable-next-line: no-submodule-imports match-default-export-name
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord"
import BugReportIcon from "@mui/icons-material/BugReport"
import VideoCallIcon from "@mui/icons-material/VideoCall"
import TextSnippetIcon from "@mui/icons-material/TextSnippet"
import QrCodeIcon from "@mui/icons-material/QrCode"

import DarkModeContext from "../ui/DarkModeContext"
import KindIcon from "../KindIcon"
import {
    DEVICE_NODE_NAME,
    SERVICE_NODE_NAME,
    VIRTUAL_DEVICE_NODE_NAME,
} from "../../../jacdac-ts/src/jdom/constants"
import bus, { UIFlags } from "../../jacdac/providerbus"
import { resolveUnit } from "../../../jacdac-ts/jacdac-spec/spectool/jdspec"
import useSnackbar from "../hooks/useSnackbar"
import SimulatorDialogsContext from "../SimulatorsDialogContext"
import useInteractionMode from "./useInteractionMode"
import { BusInteractionMode } from "../../../jacdac-ts/src/jacdac"
import useDeveloperMode from "../hooks/useDeveloperMode"

const PREFIX = "ToolsDrawer"

const classes = {
    drawer: `${PREFIX}drawer`,
    drawerPaper: `${PREFIX}drawerPaper`,
    drawerHeader: `${PREFIX}drawerHeader`,
}

const StyledDrawer = styled(Drawer)(({ theme }) => ({
    [`&.${classes.drawer}`]: {
        width: `${TOOLS_DRAWER_WIDTH}rem`,
        flexShrink: 0,
        [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
            width: `${MOBILE_TOOLS_DRAWER_WIDTH}rem`,
        },
    },

    [`& .${classes.drawerPaper}`]: {
        width: `${TOOLS_DRAWER_WIDTH}rem`,
        [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
            width: `${MOBILE_TOOLS_DRAWER_WIDTH}rem`,
        },
    },

    [`& .${classes.drawerHeader}`]: {
        display: "flex",
        alignItems: "center",
        padding: theme.spacing(0, 1),
        // necessary for content to be below app bar
        ...theme.mixins.toolbar,
        justifyContent: "flex-start",
    },
}))

function ToolsListItem(props: {
    text?: string
    to?: string
    href?: string
    icon?: JSX.Element
    onClick?: () => void
    onClose: () => void
}) {
    const { text, to, href, icon, onClick, onClose } = props
    return to || href ? (
        <Link
            to={to}
            href={href}
            target={href ? "_blank" : undefined}
            onClick={to ? onClose : undefined}
            underline="none"
        >
            <ListItemButton>
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText
                    primaryTypographyProps={{ color: "textPrimary" }}
                    primary={<span>{text}</span>}
                />
            </ListItemButton>
        </Link>
    ) : (
        <ListItemButton onClick={onClick} aria-label={text}>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText
                primaryTypographyProps={{ color: "textPrimary" }}
                primary={text}
            />
        </ListItemButton>
    )
}

export default function ToolsDrawer() {
    const { toolsMenu, setToolsMenu, showWebCam, setShowWebCam } =
        useContext(AppContext)
    const { toggleShowDeviceHostsDialog } = useContext(SimulatorDialogsContext)
    const { interactionMode } = useInteractionMode()
    const { enqueueSnackbar } = useSnackbar()
    const { toggleDarkMode, darkMode } = useContext(DarkModeContext)
    const { converters, setConverter } = useUnitConverters()
    const { developerMode, setDeveloperMode } = useDeveloperMode()
    const handleShowStartSimulator = () => toggleShowDeviceHostsDialog()
    const handleUnitClick =
        (unit: string, name: string, names: string[]) => () => {
            const index = (names.indexOf(name) + 1) % names.length
            const newName = names[index]
            setConverter(unit, newName)
            enqueueSnackbar(
                `Using ${newName} for ${resolveUnit(unit).name}`,
                "success"
            )
        }
    const handleClick = link => () => {
        setToolsMenu(false)
        link?.action()
    }
    const handleDrawerClose = () => {
        setToolsMenu(false)
    }
    const handleDarkMode = () => {
        setToolsMenu(false)
        toggleDarkMode()
    }
    const handleToggleDeveloperMode = () => setDeveloperMode(!developerMode)
    const handleToggleInteractionMode = () => {
        if (interactionMode === BusInteractionMode.Active)
            bus.interactionMode = BusInteractionMode.Observer
        else bus.interactionMode = BusInteractionMode.Active
    }
    const links = [
        {
            text: "Start simulator",
            action: handleShowStartSimulator,
            icon: <KindIcon kind={VIRTUAL_DEVICE_NODE_NAME} />,
        },
        {
            text: "Data Collector",
            to: "/tools/collector/",
            icon: <FiberManualRecordIcon />,
        },
        {},
        {
            text: "Firmware Update",
            to: "/tools/updater/",
            icon: <SystemUpdateAltIcon />,
        },
        {
            text: "Trace Analyzer",
            to: "/tools/player/",
            icon: <TextSnippetIcon />,
        },
        {
            // separator
        },
        {
            text: "Service Editor",
            to: "/tools/service-editor/",
            icon: <KindIcon kind={SERVICE_NODE_NAME} />,
        },
        {
            text: "Device registration",
            to: "/tools/device-registration/",
            icon: <KindIcon kind={DEVICE_NODE_NAME} />,
        },
        {
            text: "Device QR Code",
            to: "/tools/device-qr-code/",
            icon: <QrCodeIcon />,
        },
        {
            text: "Device Tester",
            to: "/tools/device-tester/",
            icon: <BugReportIcon />,
        },
        {
            // separator
        },
        ...converters.map(({ unit, name, names }) => ({
            text: `${name} (change to ${names
                .filter(n => n !== name)
                .join(", ")})`,
            action: handleUnitClick(unit, name, names),
        })),
        {
            // separator
        },
        {
            text:
                interactionMode === BusInteractionMode.Active
                    ? "Use Observer or Passive mode"
                    : "Use Active mode",
            title: "Change how the browser interacts with sensors and devices on the bus",
            action: handleToggleInteractionMode,
        },
        {
            text: developerMode ? "Exit Developer Mode" : "Use Developer Mode",
            title: "Allows to connect to any device, increased logging",
            action: handleToggleDeveloperMode,
        },
        UIFlags.webcam && {
            text: showWebCam ? "Stop WebCam" : "Start WebCam",
            icon: <VideoCallIcon />,
            action: () => setShowWebCam(!showWebCam),
        },
    ].filter(l => !!l)

    if (!toolsMenu) return null

    return (
        <StyledDrawer
            className={classes.drawer}
            variant="persistent"
            anchor="right"
            open={toolsMenu}
            classes={{
                paper: classes.drawerPaper,
            }}
        >
            <div className={classes.drawerHeader}>
                <IconButton
                    aria-label="Collapse"
                    onClick={handleDrawerClose}
                    size="large"
                >
                    <ChevronRightIcon />
                </IconButton>
            </div>
            <List component="div">
                {links.map((link, i) =>
                    link.text ? (
                        <ToolsListItem
                            key={link.text}
                            {...link}
                            onClick={handleClick(link)}
                            onClose={handleDrawerClose}
                        />
                    ) : (
                        <Divider key={`div${i}`} />
                    )
                )}
                <Divider />
                <ListItem
                    button={true}
                    onClick={handleDarkMode}
                    aria-label="Toggle Dark Mode"
                >
                    <ListItemIcon>
                        <SettingsBrightnessIcon />
                    </ListItemIcon>
                    <ListItemText>
                        {darkMode === "light" ? "Dark Mode" : "Light mode"}
                    </ListItemText>
                </ListItem>
            </List>
        </StyledDrawer>
    )
}
