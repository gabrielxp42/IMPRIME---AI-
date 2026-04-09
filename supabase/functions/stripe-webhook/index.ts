import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16', // Use latest API version
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
    const signature = req.headers.get('Stripe-Signature')

    if (!signature) {
        return new Response('No signature', { status: 400 })
    }

    try {
        const body = await req.text()

        // 1. Verify the event comes from Stripe
        const event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET') ?? '',
            undefined,
            cryptoProvider
        )

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Handle specific events
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object
                const clientReferenceId = session.client_reference_id
                const userEmail = session.customer_details?.email

                // Metadata passed during checkout creation
                // Note: With payment links, you need to ensure client_reference_id is set
                // OR rely on email matching (less secure but works for simplistic setups)

                if (userEmail) {
                    // Find user by email
                    const { data: user } = await supabase
                        .from('auth.users') // Accessing auth schema usually requires admin API
                    // Actually, best to query public profiles if email is stored
                    // But 'process_payment' RPC handles upgrade by ID.

                    // Let's assume we map email -> user_id

                    // BETTER: Use the client_reference_id if you pass it in the payment link URL ?client_reference_id={user_id}
                    // If not, we fall back to email matching in public.profiles

                    console.log(`Processing payment for ${userEmail}`)

                    // Fetch user ID from profiles
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('email', userEmail)
                        .single()

                    if (profile) {
                        // Determine plan based on amount or product ID
                        // e.g. amount_total: 5990 -> Plan 2
                        const amount = session.amount_total
                        let planId = null
                        let isRefill = false

                        if (amount === 5990) planId = 2 // Pro
                        if (amount === 14990) planId = 3 // Expert
                        if (amount === 1490) isRefill = true // 50 Credits Refill (approx)

                        // Run the RPC
                        if (isRefill) {
                            await supabase.rpc('add_credits', { amount: 50, user_id: profile.id }) // You might need to update add_credits to accept user_id param
                        } else if (planId) {
                            await supabase.rpc('process_payment', { p_plan_id: planId, p_user_id: profile.id }) // You need to update RPC to allow passing user_id
                        }
                    }
                }
                break
            }

            case 'invoice.paid': {
                // Handle recurring subscription renewal
                const invoice = event.data.object
                const customerEmail = invoice.customer_email

                if (customerEmail) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('email', customerEmail)
                        .single()

                    if (profile) {
                        // Add monthly credits based on plan
                        // Simplified logic: just give 500 for now or check product ID
                        await supabase.rpc('add_credits', { amount: 500, p_user_id: profile.id })
                    }
                }
                break
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
        })

    } catch (err) {
        console.error(err)
        return new Response(err.message, { status: 400 })
    }
})
