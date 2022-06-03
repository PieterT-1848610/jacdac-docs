import { Grid } from "@mui/material"
import { withPrefix } from "gatsby-link"
import { StaticImage } from "gatsby-plugin-image"
import React, { lazy, useContext } from "react"
import CarouselGrid from "./CarouselGrid"
import CenterGrid from "./CenterGrid"
import FeatureItem from "./FeatureItem"
import SplitGrid from "./SplitGrid"
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus"
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck"
import FindReplaceIcon from "@mui/icons-material/FindReplace"
import SubscriptionsIcon from "@mui/icons-material/Subscriptions"
import HTML5Image from "./HTML5Image"
import DarkModeContext from "../ui/DarkModeContext"
import Suspense from "../ui/Suspense"
const JacdaptorImageList = lazy(() => import("./JacdaptorImageList"))

export default function Home() {
    const { imgStyle } = useContext(DarkModeContext)
    return (
        <Grid
            container
            spacing={10}
            direction="column"
            alignContent="center"
            alignItems="center"
        >
            <SplitGrid
                title="Jacdac"
                subtitle3="Connect and code electronics. Instantly."
                imageColumns={6}
                image={
                    <StaticImage
                        src="./manymodules2.png"
                        alt="Many Modules Together"
                        imgStyle={imgStyle}
                    />
                }
            />

            <SplitGrid
                right={false}
                subtitle="Electronics"
                description="Jacdac devices are connected via 3-wire cables."
                image={
                    <StaticImage
                        src="./rotarycable.png"
                        alt="A rotary encoder module with a Jacdac cable attached."
                        imgStyle={imgStyle}
                    />
                }
                buttonText="Device catalog"
                buttonVariant="link"
                buttonUrl="/devices/"
            />

            <SplitGrid
                right={true}
                subtitle="Coding"
                description="Code applications in JavaScript, MakeCode, .NET, Python, ..."
                buttonText="Client programming"
                buttonVariant="link"
                buttonUrl="/clients/"
                image={<HTML5Image />}
            />

            <CenterGrid
                subtitle="Want to know more? Read on!"
                // imageColumns={6}
                // image={<StaticImage src="./dashboard.png" alt="Dashboard" />}
            />


            <SplitGrid
                right={false}
                subtitle="Making connections"
                description="Jacdac's PCB edge connector is robust, double-sided, and low cost."
                buttonText="Connector"
                buttonVariant="link"
                buttonUrl="/reference/connector/"
                imageColumns={6}
                image={
                    <StaticImage
                        src="./mechanicalclickconnector.png"
                        alt="Cable and connector"
                        imgStyle={imgStyle}
                    />
                }
            />

            <SplitGrid
                right={true}
                subtitle="Robust cables"
                description="Cables make plug-and-play simple and error-free."
                buttonText="Cable"
                buttonVariant="link"
                buttonUrl="/reference/cable/"
                imageColumns={6}
                image={
                    <StaticImage
                        src="./mechanicalclickconnector.png"
                        alt="Cable and connector"
                        imgStyle={imgStyle}
                    />
                }
            />

            <SplitGrid
                right={false}
                subtitle="Plays well with others"
                description="Jacdaptors allow Jacdac to integrate with other ecosystems."
                buttonText="Jacdaptors"
                buttonVariant="link"
                buttonUrl="/reference/jacdaptors"
                imageColumns={6}
                image={
                    <Suspense>
                        <JacdaptorImageList />
                    </Suspense>
                }
            />

            <SplitGrid
                right={true}
                subtitle="Services"
                description="Jacdac services provide an abstract view of a device's features."
                buttonText="Service catalog"
                buttonVariant="link"
                buttonUrl="/services/"
                image={
                    <StaticImage
                        src="./dashboard.png"
                        alt="Dashboard of devices"
                    />
                }
            />

            <SplitGrid
                right={false}
                subtitle="Web Tools"
                description="Visualize, debug, sniff, track, record, replay, update... from your browser"
                buttonText="Get productive with Jacdac"
                buttonVariant="link"
                buttonUrl="/tools/"
                image={<StaticImage src="./devicetree.png" alt="Device tree" />}
            />

            <SplitGrid
                right={true}
                subtitle="Clients and Servers"
                description="Jacdac servers (modules) encapsulate sensors/actuators. Jacdac clients (brains) are programmable."
                buttonText="Clients and servers"
                buttonVariant="link"
                buttonUrl="/reference/clientserver/"
                imageColumns={6}
                image={
                    <img
                        loading="lazy"
                        alt="jacdac bus"
                        src={withPrefix("/images/jdbus.drawio.svg")}
                        style={imgStyle}
                    />
                }
            />
            <SplitGrid
                right={true}
                subtitle="For Manufacturers"
                description="Add Jacdac to your devices. Schematics, footprints, libraries, firmware, hardware designs - all open source."
                imageColumns={6}
                centered={true}
                buttonText="Device Development Kit"
                buttonUrl="/ddk/"
                buttonVariant="link"
                image={
                    <StaticImage
                        src="./pcbfootprint.png"
                        alt="PCB connector footprint"
                    />
                }
            />

            <CenterGrid
                subtitle="Discover the benefits of Jacdac"
                description="Jacdac devices send packets over a bus--each device advertises itself and its set of services."
            />

            <CarouselGrid>
                <Grid item xs={12} sm={6}>
                    <FeatureItem
                        startImage={<DirectionsBusIcon fontSize="large" />}
                        description="Bus topology"
                        caption="Jacdac packets are sent among devices on the Jacdac bus and may also be sent over WebUSB/WebBLE, providing connectivity to web-based tooling and services."
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FeatureItem
                        startImage={<PlaylistAddCheckIcon fontSize="large" />}
                        description="Device discovery and service advertisement"
                        caption="Any device that hosts a service must also run the control service, which is responsible for advertising any services a device is running every 500 milliseconds."
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FeatureItem
                        startImage={<FindReplaceIcon fontSize="large" />}
                        description="Standardized service abstraction"
                        caption="Services allow devices with different hardware, but the same functionality, to replace one another - no need to recompile user applications."
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FeatureItem
                        startImage={<SubscriptionsIcon fontSize="large" />}
                        description="Full stack from 8bit MCU to web development"
                        caption="The physical protocol layer sends/receives a byte buffer (representing a Jacdac frame): Single Wire Serial connects MCUs to each other using UART."
                    />
                </Grid>
            </CarouselGrid>
        </Grid>
    )
}
