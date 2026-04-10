// 시야 — KIS API 현재가 조회 Edge Function

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const KIS_BASE = 'https://openapi.koreainvestment.com:9443'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 토큰 캐시 (메모리)
let cachedToken: string | null = null
let tokenExpiresAt = 0

// 현재가 캐시 (종목별, 30초 TTL)
const priceCache = new Map<string, { data: Record<string, unknown>; expiresAt: number }>()

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken
  }

  const appKey = Deno.env.get('KIS_APP_KEY')!
  const appSecret = Deno.env.get('KIS_APP_SECRET')!

  const resp = await fetch(`${KIS_BASE}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: appKey,
      appsecret: appSecret,
    }),
  })

  if (!resp.ok) {
    throw new Error(`Token error: ${resp.status}`)
  }

  const data = await resp.json()
  cachedToken = data.access_token
  // 23시간 후 만료 (실제 24시간이지만 여유)
  tokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000
  return cachedToken!
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const appKey = Deno.env.get('KIS_APP_KEY')
    const appSecret = Deno.env.get('KIS_APP_SECRET')
    if (!appKey || !appSecret) {
      return new Response(
        JSON.stringify({ error: 'KIS API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { stock_code } = await req.json()
    if (!stock_code) {
      return new Response(
        JSON.stringify({ error: 'stock_code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 캐시 확인 (30초 TTL)
    const cached = priceCache.get(stock_code)
    if (cached && Date.now() < cached.expiresAt) {
      return new Response(
        JSON.stringify(cached.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = await getAccessToken()

    const params = new URLSearchParams({
      FID_COND_MRKT_DIV_CODE: 'J',
      FID_INPUT_ISCD: stock_code,
    })

    const resp = await fetch(
      `${KIS_BASE}/uapi/domestic-stock/v1/quotations/inquire-price?${params}`,
      {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          authorization: `Bearer ${token}`,
          appkey: appKey,
          appsecret: appSecret,
          tr_id: 'FHKST01010100',
          custtype: 'P',
          tr_cont: '',
        },
      }
    )

    if (!resp.ok) {
      throw new Error(`KIS API error: ${resp.status}`)
    }

    const kisData = await resp.json()
    if (kisData.rt_cd !== '0') {
      throw new Error(`KIS API rt_cd: ${kisData.rt_cd}, msg: ${kisData.msg1}`)
    }

    const output = kisData.output || {}
    const price = parseInt(output.stck_prpr || '0')
    const changePrice = parseInt(output.prdy_vrss || '0')
    const changePct = parseFloat(output.prdy_ctrt || '0')
    const volume = parseInt(output.acml_vol || '0')
    // prdy_vrss_sign: 1=상한, 2=상승, 3=보합, 4=하한, 5=하락
    const sign = output.prdy_vrss_sign
    const signedChange = (sign === '4' || sign === '5') ? -Math.abs(changePrice) : changePrice
    const signedPct = (sign === '4' || sign === '5') ? -Math.abs(changePct) : changePct

    const result = {
      stock_code,
      price,
      change_pct: signedPct,
      change_price: signedChange,
      volume,
      timestamp: new Date().toISOString(),
    }

    // 캐시 저장 (30초)
    priceCache.set(stock_code, { data: result, expiresAt: Date.now() + 30_000 })

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
