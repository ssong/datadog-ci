import {readFileSync} from 'fs'

import {XMLParser, XMLValidator} from 'fast-xml-parser'

type PlistNode = {[tagName: string]: [{[valueType: string]: string | number | PlistNode}]}

class PlistContent {
  private content: PlistNode[]
  constructor(content: PlistNode[]) {
    this.content = content
  }

  public getContent = () => this.content

  /**
   *
   * @param propertyName
   * @returns
   */
  public getPropertyValue = (propertyName: string): string | number => {
    const propertyNodeIndex = this.content.findIndex((node) => {
      if (!this.isKeyNode(node)) {
        return false
      }

      return node.key[0]['#text'] === propertyName
    })

    if (propertyNodeIndex === -1) {
      throw new Error('Property not found')
    }

    const valueNode = this.content[propertyNodeIndex + 1]
    if (!this.isStringNode(valueNode)) {
      throw new Error('Property is not a string, this is not supported yet')
    }

    return valueNode.string[0]['#text']
  }

  /**
   * A key entry will be turned into element of the content looking like this:
   * ```
   * {
   *   "key": [
   *     {
   *       "#text": "CFBundleDevelopmentRegion",
   *     },
   *   ],
   * }
   * ```
   */
  private isKeyNode = (node: PlistNode): node is {key: [{'#text': string}]} => {
    return !!node.key
  }

  /**
   * A string entry will be turned into element of the content looking like this:
   * ```
   * {
   *   "string": [
   *     {
   *       "#text": "1.0.3",
   *     },
   *   ],
   * }
   * ```
   */
  private isStringNode = (node: PlistNode): node is {string: [{'#text': string | number}]} => {
    return !!node.string
  }
}

export const parsePlist = (plistPath: string): PlistContent => {
  const xmlFileContentString = readFileSync(plistPath).toString()
  const validationOutput = XMLValidator.validate(xmlFileContentString)

  if (validationOutput !== true) {
    throw new Error(validationOutput.err.msg)
  }

  const xmlParser = new XMLParser({preserveOrder: true})
  const [_xmlHeader, plistDeclaration] = xmlParser.parse(xmlFileContentString)

  const plistContent = plistDeclaration.plist[0].dict as PlistNode[]

  return new PlistContent(plistContent)
}
