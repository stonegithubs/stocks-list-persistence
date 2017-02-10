'use strict'

const cheerio = require('cheerio')
const rp = require('request-promise')
const co = require('co')
const fs = require('fs')
const iconv = require('iconv-lite')

const file = fs.readFileSync('./stock_code.txt', 'utf8')
const SINA_STOCKS_API = 'http://hq.sinajs.cn/list='
const stockCodes = file.split(';')
const cycles = stockCodes.length

const sleep = () => {
    let pr = new Promise((resolve, reject) => {
        setTimeout(resolve, 1000)
    })
    return pr
}

co(function* () {
    // 初始化stocks内容
    const page = yield rp.get('http://quote.eastmoney.com/stocklist.html')
    const $ = cheerio.load(page)

    const dom = $('#quotesearch > ul').find('a')
    const arr = Array.from(dom)
    const stockCodeList = arr.map(i => {
        const n = i.attribs.href.split('/')
        const code = n[n.length - 1].split('.html')[0]
        return code
    })
    fs.writeFileSync('./stock_code.txt', stockCodeList.join(';'))
    console.log(`完成初始化stocks ... 当前${stockCodeList.length}支 ... 等待1s`)
    
    yield sleep()

    // 持续查询
    for (let n = 0; n <= cycles - 1; n++) {
        let buffer = yield rp({
            method: 'GET',
            uri: SINA_STOCKS_API + stockCodes[n],
            encoding: null
        })
        let decode = iconv.decode(buffer, 'GBK')
        console.log(decode)
        yield sleep()
    }
})
.catch(e => console.error(e))

// // ---- 注意计算过程中api挂掉的情况 ----
// // ---- 个体查询 ------
// co(function* () {
//     let buffer = yield rp({
//         method: 'GET',
//         uri: SINA_STOCKS_API + 'sh502003',
//         encoding: null
//     })
//     let decode = iconv.decode(buffer, 'GBK')
//     console.log(decode)
// })
// .catch(e => console.error(e))