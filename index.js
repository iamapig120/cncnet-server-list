const express = require('express')
const geoip = require('geoip-country')
const countrylookup = require('country-code-lookup')

const app = express()

const PORT = 18002
const HOSTNAME = '' // Example abc.com
const SERVER_PASSWORD = ''

const server_list = {}

app.get('/master-announce', (req, res) => {
  try {
    if (HOSTNAME?.length > 0 && req.hostname !== HOSTNAME) {
      res.status(403).send('Wrong hostname.')
    }
    if (SERVER_PASSWORD?.length > 0 && req.query.masterpw !== SERVER_PASSWORD) {
      res.status(403).send('Wrong password.')
    }

    const query = req.query

    const ip = req.ip // IP
    const version = query.version // 版本
    const name = query.name // 服务器名称
    const port = query.port // 端口号
    const clients = query.clients // 当前连接数
    const maxclients = query.maxclients // 最大连接数
    const masterpw = query.masterpw // 通告服务器密码
    const maintenance = query.maintenance // 维护模式开关

    const address = `${ip}:${port}`
    if (server_list[address]) {
      const info = new Proxy(server_list[address], {
        get(target, key) {
          return target[key]
        },
        set(target, key, val) {
          target[key] = val
        },
      })
      clearTimeout(info.timer)
      // info.ip = ip
      // info.port = port
      // info.address = address
      info.version = version
      info.name = name
      // info.countrycode = geoip.lookup(ip)?.country || 'ZZ'
      // info.country = countrylookup.byIso(info.countrycode)?.country || 'Unknown'
      info.clients = clients
      info.maxclients = maxclients
      info.masterpw = masterpw
      info.maintenance = maintenance
      info.timer = setTimeout(info.deleter, 120 * 1000)
    } else {
      server_list[address] = {}
      const info = new Proxy(server_list[address], {
        get(target, key) {
          return target[key]
        },
        set(target, key, val) {
          target[key] = val
        },
      })
      info.deleter = () => {
        delete server_list[address]
      }
      info.ip = ip
      info.port = port
      info.address = address
      info.version = version
      info.name = name
      info.countrycode = geoip.lookup(ip)?.country || 'ZZ'
      info.country = countrylookup.byIso(info.countrycode)?.country || 'Unknown'
      info.clients = clients
      info.maxclients = maxclients
      info.masterpw = masterpw
      info.maintenance = maintenance
      info.timer = setTimeout(info.deleter, 120 * 1000)
    }
    res.status(200).send('OK')
  } catch (err) {
    res.status(403).send('Wrong params')
  }
})

app.get('/master-list', (req, res) => {
  try {
    const server_array = Object.values(server_list)
    server_array.sort((a, b) => {
      return a.name.localeCompare(b.name)
    })
    let body =
      'address;country;countrycode;name;password;clients;maxclients;official;latitude;longitude;version;distance\r\n'
    server_array.forEach(
      ({
        address,
        country,
        countrycode,
        name,
        clients,
        maxclients,
        version,
      }) => {
        body += `${address};${country};${countrycode};${name};0;${clients};${maxclients};0;0;0;${version};0\r\n`
      }
    )
    res.status(200).send(body)
  } catch (err) {
    res.status(500).send('Server Error.')
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Example app listening on port ${PORT}`)
})
