'use server';
/**
 * @fileOverview A flow to fetch the latest currency exchange rate.
 *
 * - fetchExchangeRate - A function that fetches the USD to SYP exchange rate.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ExchangeRateOutputSchema = z.number().describe("The exchange rate for USD to SYP");

export async function fetchExchangeRate(): Promise<number> {
    return exchangeRateFlow();
}

const exchangeRateFlow = ai.defineFlow(
    {
        name: 'exchangeRateFlow',
        inputSchema: z.void(),
        outputSchema: ExchangeRateOutputSchema,
    },
    async () => {
        try {
            const response = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=SYP');
            if (!response.ok) {
                throw new Error(`API call failed with status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.rates && data.rates.SYP) {
                // Round to a reasonable number of decimal places or integer
                return Math.round(data.rates.SYP);
            } else {
                throw new Error('SYP rate not found in API response');
            }
        } catch (error) {
            console.error("Failed to fetch exchange rate:", error);
            // In case of failure, you might want to return a default/fallback rate
            // or re-throw the error to be handled by the caller.
            // For now, re-throwing.
            throw new Error('Could not fetch exchange rate from the external API.');
        }
    }
);
