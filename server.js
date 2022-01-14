import http, { get } from "http"
import { resolve, join, dirname } from "path"
import fs from "fs/promises"

import recursiveReadDir from "recursive-readdir"

const server = http.createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*")
  if (request.url === "/manifest.json") {
    const files = await recursiveReadDir("dist")

    response.write(JSON.stringify(files.map(cleanFileName)))
    response.end()
    return
  }
  const filename = join(...request.url.replace(/^\//, "").split("_"))
  try {
    const file = await fs.readFile(join("dist", filename))
    // have to add extensions to relative imports... boooooo
    const correctedImports = file.toString().replace(/from "\.\/(.*)"/g, `from "./$1.js"`)
    response.write(correctedImports)
    response.end()
  } catch (err) {
    console.log(err)
    response.writeHead(404)
    response.end()
  }
})

function cleanFileName(filename) {
  return filename.replace("dist/", "").replace("dist\\", "").replaceAll("\\", "_")
}

server.listen(18718, () => {
  console.log(`server started at http://localhost:18718`)
})
