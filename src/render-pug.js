const html2jade = require('html2jade')
const beautify = require('js-beautify')
const indentString = require('indent-string')
const { render: renderVnode } = require('./vnode')
const cssRules = require('./css-rules')

function toPug(html) {
  return new Promise((resolve, reject) => {
    const options = {
      bodyless: true,
      donotencode: true
    }
    html2jade.convertHtml(html, options, (err, jade) => {
      if (err) {
        reject(err)
      } else {
        resolve(jade)
      }
    })
  })
}

async function renderComponent(vnode) {
  const css = cssRules.resolve(vnode)
  const prettyCSS = css
    ? beautify.css(css, {
        indent_size: 2,
        space_around_selector_separator: true,
        end_with_newline: true
      })
    : ''
  const style = prettyCSS ? `style.\n${indentString(prettyCSS, 2)}` : ''

  const html = renderVnode(vnode)
  const pug = await toPug(html)

  return [pug, style].filter(x => x).join('\n'.repeat(2))
}

async function renderResizableComponent(vnode) {
  const html = await renderComponent(vnode)
  const className = (vnode.getAttr('class') || '').split(/\s+/)[0]
  const widthResizable = !vnode._contentWidth
  const heightResizable = !vnode._contentHeight
  const resizeCode = [
    widthResizable ? `event.target.style.width = event.rect.width + 'px'` : '',
    heightResizable
      ? `event.target.style.height = event.rect.height + 'px'`
      : ''
  ]
    .filter(x => x)
    .join('\n')
  const script =
    className && resizeCode
      ? `//-
  A script to check how a component looks when it's resized.
  You can remove this script if you wish.
script(src="https://cdn.jsdelivr.net/npm/interactjs@latest")
script.
  interact(document.querySelector('.${className}'))
    .resizable({
      edges: {
        bottom: ${JSON.stringify(heightResizable)},
        right : ${JSON.stringify(widthResizable)}
      }
    })
    .on('resizemove', function(event) { ${resizeCode} })
`
      : ''
  return [html, script].filter(x => x).join('\n'.repeat(2))
}

module.exports = renderResizableComponent