/* eslint-disable @typescript-eslint/ban-types */
import workerProxy from "./proxy"
import type {
    CadConvertRequest,
    CadConvertResponse,
} from "../../../../workers/cad/dist/node_modules/cad.worker"
import type {
    EnclosureModel,
    EnclosureOptions,
    EnclosureFile,
} from "../../../../workers/cad/dist/node_modules/enclosurecad"

export async function convertToSTL(
    model: EnclosureModel,
    options?: EnclosureOptions
): Promise<{ stls?: EnclosureFile[]; error?: string }> {
    const worker = workerProxy("cad")
    const res = await worker.postMessage<CadConvertRequest, CadConvertResponse>(
        {
            worker: "cad",
            type: "convert",
            model,
            options,
        }
    )
    return { stls: res?.stls, error: res?.error }
}
