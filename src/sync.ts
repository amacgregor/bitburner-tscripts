import { NS } from "../NetscriptDefinitions"

export async function main(ns: NS): Promise<void> {
    await ns.wget("http://localhost:18718/manifest.json", "manifest.txt")
    const manifest = JSON.parse(ns.read("manifest.txt"))
    ns.rm("manifest.txt")
    for (const file of manifest) {
        const localFilePath = getPrefix(file) + file.replaceAll("_", "/")
        ns.tprint(`Local filepath ${localFilePath} from http://localhost:18718/${file}`)
        await ns.wget(`http://localhost:18718/${file}`, localFilePath)
    }
}

function getPrefix(filename: string): string {
    if (filename.indexOf('_') > -1) {
        return "/"
    }
    return ""
}