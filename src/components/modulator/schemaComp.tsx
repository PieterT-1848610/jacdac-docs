import { Grid } from "@mui/material";
import React from "react";
import GridHeader from "../ui/GridHeader";
import { LogicSup, ModuExtern, PinAlloc,} from "./helper/types";
import ModuleComponent from "./moduleComponent";
import ManualAddComp from "./manualAddComponent";


type Props={
    modules: ModuExtern[];
    allocedPins: PinAlloc[];
    logicDeviders: LogicSup[];
    removeFunc: (moduleName: string) =>void;
    addSchema: (moduleId: string) => void;
}

const SchemaComp: React.FC<Props> = ({modules, removeFunc, allocedPins, addSchema}) =>{
    const moduAllocList = (moduleName: string) =>{
        const tempList = [];
        allocedPins.forEach(function (valPin) {
            if(valPin.moduleName === moduleName){
                tempList.push(valPin)
            }
        });
        //console.log("SchemaComp TempList: "+tempList + "moduleName: "+moduleName)
        return tempList;
    }
    
    
    return(
        <Grid xs={7} item style={{paddingTop:0}}>
            <GridHeader title={"Added modules"} action={<ManualAddComp addSchema={addSchema}/>}/>
            <div style={{overflowY:"scroll", maxHeight:"55vh"}}>
                {modules.map((mod, index) => (

                    <ModuleComponent module={mod} removeFunc={removeFunc} allocedPins={moduAllocList(mod.name)} key={index}/>
                ))}
            </div>
        </Grid>
    )

}

export default SchemaComp;
