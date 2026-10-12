import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: Request) {
  try {
    // -------------------------------------------------------
    // Step 1: Initialize Admin client using SERVER env vars
    // This is the Supabase Service Role key, NOT the user's
    // widget key. It bypasses RLS completely.
    // -------------------------------------------------------
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('FATAL: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500, headers: corsHeaders }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Parse the request body first
    const body = await request.json()
    const { data, webhookUrl: payloadWebhookUrl } = body

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Invalid data payload' },
        { status: 400, headers: corsHeaders }
      )
    }

    let webhookUrl = payloadWebhookUrl

    // -------------------------------------------------------
    // Step 2: If no webhookUrl is in the payload, we must
    // look it up in Supabase using the user's API key.
    // If a webhookUrl IS provided directly, skip auth check.
    // -------------------------------------------------------
    if (!webhookUrl) {
      const authHeader = request.headers.get('authorization')
      const userApiKey = authHeader?.replace('Bearer ', '').trim()

      if (!userApiKey) {
        return NextResponse.json(
          { error: 'Missing API key in Authorization header. Provide an apiKey prop or a webhookUrl.' },
          { status: 401, headers: corsHeaders }
        )
      }

      const { data: settings, error } = await supabaseAdmin
        .from('user_settings')
        .select('webhook_url')
        .eq('api_key', userApiKey)
        .single()

      if (error || !settings) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401, headers: corsHeaders }
        )
      }

      webhookUrl = settings.webhook_url
    }

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'No webhook URL configured. Set one in the dashboard or pass webhookUrl as a prop.' },
        { status: 400, headers: corsHeaders }
      )
    }

    // -------------------------------------------------------
    // Step 4: Forward the data to the user's webhook
    // -------------------------------------------------------
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSV-Bridge-Event': 'data_import',
      },
      body: JSON.stringify({
        event: 'data_import',
        timestamp: new Date().toISOString(),
        rows: data.length,
        data: data,
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Destination webhook failed: ${response.status}` },
        { status: 502, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Data delivered' },
      { headers: corsHeaders }
    )

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Ingest API error:', message)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
