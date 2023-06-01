import {useEffect, useId, useState } from "react";
import React from "react"
import { Grid } from "@mui/material"
import GridHeader from "../ui/GridHeader"
import PinLayoutComp from "./pinLayoutComp";
import SchemaComp from "./schemaComp";
import Button from "../ui/Button";
import { fetchLogic, fetchModule, fetchPinLayout, predicate } from "./helper/file";
import { Breakout, LogicPair, LogicSup, ModuExtern, Pin, PinAlloc,  TypePin, powerSup } from "./helper/types";
import SerialThing from "./serialThing";
import PowerSupplyComp from "./powerSupplyComp";
import ServiceCodeComp from "./serviceStartComponent";
import ClientStartModu from "./clientStartModu";
import { sort } from "@tidyjs/tidy";
import ExtraNeededComp from "./logicLevelComp";



//TODO: change pin allocation way
//TODO: try highlighting pin needed connect
//TODO: try create auto client code

// type Props={
//     breakoutBoard: Breakout;
// }
async function getBreakout():Promise<Breakout>{
    return await fetchPinLayout();
}

const ModulatorComp = () =>{
    const sectionId = useId();
    const [conModules, setconModules] = useState<Array<ModuExtern>>([]);
    const [breakoutBoard, setBreakoutBoard] = useState(undefined as Breakout | undefined);
    const [allocedPins, setAllocedPins] = useState<Array<PinAlloc>>([]);
    const [conPowerSup, setconPowerSup] = useState<Array<powerSup>>([]);
    const [conLogicLevels, setconLogicLevels] = useState<Array<LogicSup>>([]);

    const [, updateState] = React.useState({});
    const forceUpdate = React.useCallback(() => updateState({}), [])

    useEffect(() =>{
        getBreakout().then((data) => {
            setBreakoutBoard(data);
        })
        

    }, [])

   
    const removeConModule = (moduleName: string) => {
        //remove from conModules
        const indexconModule = conModules.findIndex( i => i.name === moduleName);
        const tempConModule = conModules
        tempConModule.splice(indexconModule, 1);
        
        //remove from allocedPins
        const tempAllocedPins = allocedPins.filter(function(value) { return value.moduleName !== moduleName});
        
        //Remove from breakoutBoard
        const tempPinOut = breakoutBoard.pinOut
        tempPinOut.forEach(function(value) {
            if(value.used){
                const tempIndex = value.moduleName.findIndex(i => i === moduleName);
                if(tempIndex !== -1){
                    if(value.moduleName.length === 1){
                        value.used = false;
                    }
                    value.moduleName.splice(tempIndex, 1);
                    value.modulePin.splice(tempIndex, 1);
                }
            }
        })
        const tempBreakout = breakoutBoard;
        tempBreakout.pinOut = tempPinOut;

        //Remove from powerSupply
        const indexlistPowerSup = [];
        const tempPowerSup = conPowerSup;
        tempPowerSup.forEach(function(value, index) {
            const tempIndex = value.conModule.findIndex(i => i === moduleName);
            if(tempIndex !== -1){
                if(value.conModule.length === 1){
                    indexlistPowerSup.unshift(index);
                }
                value.conModule.splice(tempIndex, 1);
            }
        });
        indexlistPowerSup.forEach(function(value) {
            tempPowerSup.splice(value, 1);
        })

        const indexlistLogicLevels = [];
        const tempLogicLevel = conLogicLevels;
        tempLogicLevel.forEach(function (value, index){
            const tempIndex = value.conModule.findIndex(i => i === moduleName);
            if(tempIndex !== -1){
                const otherIndexs = [];
                value.conPairs.forEach(function (valuePair, indexPair){
                    if(valuePair.moduleName === moduleName){
                        otherIndexs.unshift(indexPair);
                    }
                })
                otherIndexs.forEach(function(valueList){
                    value.conPairs.splice(valueList, 1);
                })
                if(value.conPairs.length === 0){
                    indexlistLogicLevels.unshift(index);
                }
                value.conModule.splice(tempIndex, 1);

            }
        });
        indexlistLogicLevels.forEach(function(value){
            tempLogicLevel.splice(value, 1);
        })


        setconModules(tempConModule);
        setAllocedPins(tempAllocedPins);
        setBreakoutBoard(tempBreakout);
        setconPowerSup(tempPowerSup);
        setconLogicLevels(tempLogicLevel);

        forceUpdate();

    }


    const addSchema = async (id: string) =>{
        //console.log("new comp id: "+id);
        //"sr04" == 897654321;
        const tempModu = await fetchModule(id);
        
        
        const tempModuPins = await breakBoardAllocCheck(tempModu);
        if(tempModuPins){
            if(tempModuPins.pinAlloctedTemp.length !== 0){
                breakBoardAllocPins(tempModuPins.pinAlloctedTemp);
                if(tempModuPins.pinDifLogic.length !== 0){
                    tempModuPins.pinAlloctedTemp = await allocLogicLevel(tempModuPins.pinDifLogic, tempModuPins.pinAlloctedTemp);
                }


                //Set new Alocced
                const tempAllocPin = allocedPins;
                for(let i = 0; i < tempModuPins.pinAlloctedTemp.length; i++){
                    tempAllocPin.push(tempModuPins.pinAlloctedTemp[i])
                }
                setAllocedPins(tempAllocPin);
            }

            //Place the new module
            const tempCon = conModules;
            tempCon.push(tempModu)
            setconModules(tempCon);
            
        }
        
        forceUpdate();
    }

//TODO: change pinAlloc and add different anming
//Toevoegen van voltage divider voor analoog
    const allocLogicLevel = async (pins: Pin[], pinAlloclist: PinAlloc[]): Promise<PinAlloc []> =>{
        let indexLogicBoards = -1;
        const tempLogicLevels = conLogicLevels;
        for(let i = 0; i < pins.length; i++){
            const indexPinAlloc = pinAlloclist.findIndex((value) => value.modulePin === pins[i]);

            if(pins[i].logicLevel >3.3)
                indexLogicBoards = tempLogicLevels.findIndex((value) =>( value.numberConvPins > value.conPairs.length && value.highVolt == pins[i].logicLevel ));
            else
                indexLogicBoards = tempLogicLevels.findIndex((value) =>( value.numberConvPins > value.conPairs.length && value.lowVolt == pins[i].logicLevel));
            
            console.log(tempLogicLevels);
            console.log(pins[i].logicLevel);
            

            if(indexLogicBoards !== -1){
                const logicSup = tempLogicLevels[indexLogicBoards];
                const tempPair = logicLeveLPairCreate(pins[i], pinAlloclist[indexPinAlloc], logicSup);
                logicSup.conPairs.push(tempPair);

                if(logicSup.conModule.findIndex((value) => value === pins[i].moduleId) === -1){
                    logicSup.conModule.push(pins[i].moduleId);
                }
                

                pinAlloclist[indexPinAlloc].BreakoutName = logicSup.convName;
                pinAlloclist[indexPinAlloc].pinBreakLocation = tempPair.logicPos;
                pinAlloclist[indexPinAlloc].pinBreakName = tempPair.moduleHigh.toString();

                //is place for new one
            }else{
                const newLogicSup = await fetchLogic(pins[i].logicLevel.toString());
                const tempPair = logicLeveLPairCreate(pins[i], pinAlloclist[indexPinAlloc], newLogicSup);
                newLogicSup.conPairs.push(tempPair);
                newLogicSup.conModule.push(pins[i].moduleId);

                pinAlloclist[indexPinAlloc].BreakoutName = newLogicSup.convName;
                pinAlloclist[indexPinAlloc].pinBreakLocation = tempPair.logicPos;
                pinAlloclist[indexPinAlloc].pinBreakName = tempPair.moduleHigh.toString();

                
                tempLogicLevels.push(newLogicSup);
            }
           
           
            indexLogicBoards = -1;
        }
        
        setconLogicLevels(tempLogicLevels);
        return pinAlloclist;
    }

    const logicLeveLPairCreate = (modulePin:Pin, allocedPin: PinAlloc, logicSup: LogicSup): LogicPair =>{
        const moduleHigh = modulePin.logicLevel >3.3;
        const positionLogic = listNumberFind(logicSup.conPairs);
        
        return {
            "logicPos": positionLogic,
            "moduleName": modulePin.moduleId,
            "modulePin": modulePin,
            "moduleHigh": moduleHigh,
            "pinBreakLocation": allocedPin.pinBreakLocation,
            "pinBreakName": allocedPin.pinBreakName,
            "BreakoutName": allocedPin.BreakoutName,
        }


    }

    const listNumberFind = (pairs: LogicPair[]): number =>{
        const searchList = [];
        for(let i = 0; i < pairs.length; i++){
            searchList.push(pairs[i].logicPos);
        }
        if(searchList.length == 0){
            return 0;
        }

        searchList.sort(function(a, b) {return a-b;})
        let lowest = -1;
        for(let i=0; i< searchList.length; i++){
            if(searchList[i] != i){
                lowest = i;
                break;
            }
        }
        if(lowest == -1){
            lowest = searchList[searchList.length - 1] + 1;
        }
        return lowest;
    }


    const allocVoltage = (powerPin: Pin, gndPin: Pin,moduleName: string): PinAlloc[] =>{
        const indexPWRBoard = breakoutBoard.powerPins.findIndex((value) => Number(powerPin.name) === Number(value.voltage));
        //exist power pin, with right voltage for module

        if (indexPWRBoard !== -1) {
            const gndPinloc = getIndexProtocoll(TypePin.GND);
            return([{
                moduleName: moduleName,
                modulePin: powerPin,
                pinBreakLocation: breakoutBoard.powerPins[indexPWRBoard].position,
                pinBreakName: breakoutBoard.powerPins[indexPWRBoard].name,
                powerSup: false,
                BreakoutName: breakoutBoard.name
            }, {
                moduleName: moduleName,
                modulePin: gndPin,
                pinBreakLocation: breakoutBoard.pinOut[gndPinloc].position,
                pinBreakName: breakoutBoard.pinOut[gndPinloc].name,
                powerSup: false,
                BreakoutName: breakoutBoard.name
            }])
        }
        if(conPowerSup.length > 0){
            const indexConPowerSup = conPowerSup.findIndex((value) => Number(powerPin.name) === value.voltage);
            if(indexConPowerSup !== -1){
                conPowerSup[indexConPowerSup].conModule.push(moduleName);
                return([{
                        moduleName: moduleName,
                        modulePin: powerPin,
                        pinBreakLocation: conPowerSup[indexConPowerSup].supLocPin,
                        pinBreakName: conPowerSup[indexConPowerSup].supplyName,
                        powerSup: true,
                        BreakoutName: conPowerSup[indexConPowerSup].supplyName,
                    },{
                        moduleName: moduleName,
                        modulePin: gndPin,
                        pinBreakLocation: conPowerSup[indexConPowerSup].supLocPin,
                        pinBreakName: conPowerSup[indexConPowerSup].supplyName,
                        powerSup: true,
                        BreakoutName: conPowerSup[indexConPowerSup].supplyName,
                    }]);
            }
        }else{
            const newPowerSup:powerSup = ({
                                            supplyName: "Power Supply "+powerPin.name,
                                            voltage: Number(powerPin.name),
                                            maxAmps: 5,
                                            supLocPin: 900 +Number(powerPin.name),
                                            conModule: [moduleName]
                                        });
            const tempPowerSup = conPowerSup;
            tempPowerSup.push(newPowerSup);
            setconPowerSup(tempPowerSup);

            return ([{  moduleName: moduleName,
                        modulePin: powerPin,
                        pinBreakLocation: newPowerSup.supLocPin,
                        pinBreakName: newPowerSup.supplyName,
                        powerSup: true,
                        BreakoutName: newPowerSup.supplyName,
                    },{
                        moduleName: moduleName,
                        modulePin: gndPin,
                        pinBreakLocation: newPowerSup.supLocPin,
                        pinBreakName: newPowerSup.supplyName,
                        powerSup: true,
                        BreakoutName: newPowerSup.supplyName,
                    }]);
        }
    }

    type boardReturn = {
        pinAlloctedTemp:PinAlloc[];
        pinDifLogic:Pin[];
    }

    const breakBoardAllocCheck = async (newModule: ModuExtern): Promise<boardReturn|undefined> =>{
        if(breakoutBoard){
            const sortPinlayout = newModule.pinLayout.sort((a, b) => predicate(a.typePin, b.typePin));
            const pinPossible: number[] = [];
            const pinAllocTemp: PinAlloc[] = [];
            const pinDifLogic: Pin[] = [];
            let counterBasic = 0;
            let powerModu = -1;
            let gndModu = -1;


            for(let i = 0; i < sortPinlayout.length; i++){
                if(sortPinlayout[i].typePin === TypePin.Power || sortPinlayout[i].typePin === TypePin.GND){
                    pinPossible.push(-1);
                    counterBasic += 1;
                    if(sortPinlayout[i].typePin === TypePin.Power) powerModu = i;
                    if(sortPinlayout[i].typePin === TypePin.GND) gndModu = i;
            
                }else if(sortPinlayout[i].typePin === TypePin.SclI2c || sortPinlayout[i].typePin === TypePin.SdaI2C){
                    if(checkBreakBoardI2C()){
                        const tempProtoIndex = getIndexProtocoll(sortPinlayout[i].typePin);
                        pinPossible.push(breakoutBoard.pinOut[tempProtoIndex].position);
                        pinAllocTemp.push({
                            moduleName: newModule.name,
                            modulePin: sortPinlayout[i],
                            pinBreakLocation: breakoutBoard.pinOut[tempProtoIndex].position,
                            pinBreakName: breakoutBoard.pinOut[tempProtoIndex].name,
                            powerSup: false,
                            BreakoutName: breakoutBoard.name,
                        });
                    }
                }else if(sortPinlayout[i].typePin === TypePin.SckSPI || sortPinlayout[i].typePin === TypePin.MisoSPI || sortPinlayout[i].typePin === TypePin.MosiSPI){
                    if(checkBreadBoardSPI()){
                        const tempProtoIndex = getIndexProtocoll(sortPinlayout[i].typePin);
                        pinPossible.push(breakoutBoard.pinOut[tempProtoIndex].position);
                        pinAllocTemp.push({
                            moduleName: newModule.name,
                            modulePin: sortPinlayout[i],
                            pinBreakLocation: breakoutBoard.pinOut[tempProtoIndex].position,
                            pinBreakName: breakoutBoard.pinOut[tempProtoIndex].name,
                            powerSup: false,
                            BreakoutName: breakoutBoard.name
                        });
                    }
                }else{
                    let tempPinPossible= undefined;
                    for(let j = 0; j < breakoutBoard.pinOut.length; j++){
                        //check pin is in use
                        if(!breakoutBoard.pinOut[j].used ){
                            //check if pin in temp
                            if(!pinPossible.includes(breakoutBoard.pinOut[j].position)){
                                //Check if type correct
                                if(breakoutBoard.pinOut[j].options.includes(sortPinlayout[i].typePin)){
                                    if(tempPinPossible){
                                        if(breakoutBoard.pinOut[j].options.length < tempPinPossible.options.length){
                                            tempPinPossible = breakoutBoard.pinOut[j];
                                        }
                                    }else{
                                        tempPinPossible = breakoutBoard.pinOut[j];
                                    }
                                   
                                }   
                            }
                        }
                    }
                    if(tempPinPossible){
                        pinPossible.push(tempPinPossible.position);
                        pinAllocTemp.push({ moduleName: newModule.name,
                                            modulePin: sortPinlayout[i],
                                            pinBreakLocation: tempPinPossible.position,
                                            pinBreakName: tempPinPossible.name,
                                            powerSup: false,
                                            BreakoutName: breakoutBoard.name
                                        });
                        if(sortPinlayout[i].logicLevel){
                            if(sortPinlayout[i].logicLevel !== breakoutBoard.logicPw){
                                pinDifLogic.push(sortPinlayout[i])
                            }
                        }
                    }
                } 
            }

            //All the IO ports can be connected
            if((counterBasic + pinAllocTemp.length) === newModule.numberPins){
                //Make the power and GND work, current just 1 power expect
                if(powerModu !== -1 && gndModu !== -1){
                    const voltagePin = allocVoltage(sortPinlayout[powerModu], sortPinlayout[gndModu], newModule.name);
                    for(let i=0; i< voltagePin.length; i++){
                        pinAllocTemp.push(voltagePin[i])
                    }

                }else if(gndModu !== -1){
                    const gndPin = getIndexProtocoll(TypePin.GND);
                    pinAllocTemp.push({
                        pinBreakLocation: breakoutBoard.pinOut[gndPin].position,
                        pinBreakName: breakoutBoard.pinOut[gndPin].name,
                        modulePin: sortPinlayout[gndModu],
                        moduleName: newModule.name,
                        powerSup: false,
                        BreakoutName: breakoutBoard.name
                    });
                }

                return {pinAlloctedTemp: pinAllocTemp, pinDifLogic: pinDifLogic};
            }else{
                console.log("Not possible to load in" + counterBasic + " " + pinAllocTemp.length);
                return {pinAlloctedTemp:[], pinDifLogic:[]};
            }
        }else{
            console.log("ERROR: no breakoutboard loaded in!!!");
            return undefined;
        }
        
    }

    

    const getIndexProtocoll = (protoType: TypePin): number =>{
        return breakoutBoard.pinOut.findIndex(i => i.options.includes(protoType))
    }

    const checkBreakBoardI2C = () =>{
        const indexSDA = getIndexProtocoll(TypePin.SdaI2C); 
        const indexSCL = getIndexProtocoll(TypePin.SclI2c); 
        if(indexSDA !== -1 && indexSCL !==-1){
            breakoutBoard.pinOut[indexSDA].modulePin.forEach(function (value){
                if(value.typePin !== TypePin.SdaI2C){
                    return false;
                }
            });
            breakoutBoard.pinOut[indexSCL].modulePin.forEach(function (value){
                if(value.typePin !== TypePin.SclI2c){
                    return false;
                }
            });
            return true;
        }
        return false;
    }

    const checkBreadBoardSPI = () =>{
        const indexSck = getIndexProtocoll(TypePin.SckSPI); 
        const indexMiso = getIndexProtocoll(TypePin.MisoSPI); 
        const indexMosi = getIndexProtocoll(TypePin.MosiSPI);
        if(indexSck !== -1 && indexMiso !== -1 && indexMosi !== -1){
            breakoutBoard.pinOut[indexSck].modulePin.forEach(function (value){
                if(value.typePin !== TypePin.SckSPI){
                    return false;
                }
            });
            breakoutBoard.pinOut[indexMiso].modulePin.forEach(function (value){
                if(value.typePin !== TypePin.MisoSPI){
                    return false;
                }
            });
            breakoutBoard.pinOut[indexMosi].modulePin.forEach(function (value){
                if(value.typePin !== TypePin.MosiSPI){
                    return false;
                }
            });

            return true;
        }
        return false;
    }

    //set the temp allocated pin position to the breakoutboard
    //TODO: remove pin as option
    const breakBoardAllocPins = (allocPins: PinAlloc[]) => {
        if(breakoutBoard){
            const tempBreakoutBoard = breakoutBoard;
            for(let i = 0; i<allocPins.length; i++){
                if(allocPins[i].BreakoutName === tempBreakoutBoard.name){
                    const index = tempBreakoutBoard.pinOut.findIndex(element => element.position === allocPins[i].pinBreakLocation);
                    if(index !== -1){
                        tempBreakoutBoard.pinOut[index].used = true;
                        tempBreakoutBoard.pinOut[index].moduleName.push(allocPins[i].moduleName);
                        tempBreakoutBoard.pinOut[index].modulePin.push(allocPins[i].modulePin);
                    }
                }else{
                    continue;
                }
            }
            setBreakoutBoard(tempBreakoutBoard);
        }
    }


    //message needs to be at least 11 long
    const getSerialMsg = async (msg: string) => {
        if(msg.length >= 10){
            console.log("new Message: "+msg);
            await addSchema(msg.trim());
        }
    }

    //TODO: add code for led.enable when some pins are used

    return(
        <section id={sectionId}>
            <Grid container spacing={5}>
                <GridHeader title={"Modulator"} action={<span><SerialThing addComp={getSerialMsg}/> </span>}/>
                <Grid xs={5} item style={{paddingTop:"0"}}>
                    <Grid
                        direction={"column"}
                        container
                    >
                        {<h3>First Code for Makecode: led.enable(false);</h3>}
                        
                        
                        {conPowerSup.length >0?<PowerSupplyComp supplies={conPowerSup}/>:null}
                        {conLogicLevels.length >0?<ExtraNeededComp supplies={conLogicLevels} />: null}
                        {/* {conModules.length >0? <ServiceCodeComp modules={conModules}/>: null} */}
                        {/* {conModules.length >0? <ClientStartModu modules={conModules}/>: null} */}
                        <PinLayoutComp/>
                    </Grid>
                </Grid>

            <SchemaComp modules={conModules} logicDeviders={conLogicLevels} removeFunc={removeConModule} allocedPins={allocedPins} addSchema={addSchema}/>
            


            </Grid>

        </section>
    )
}

    
export default ModulatorComp;
