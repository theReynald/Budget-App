import type { AIExpandedTip } from '../src/types';

// Stub function simulating an AI/MCP expansion for a given tip id.
// In a future implementation, replace with real MCP client invocation.
export async function expandTipViaMCP(tipId: string, model: string): Promise<AIExpandedTip> {
    // Simulate latency
    await new Promise(r => setTimeout(r, 250));
    const now = new Date().toISOString();
    return {
        tipId,
        baseTipId: tipId,
        summary: 'Expanded context and actionable guidance for the selected tip.',
        deeperDive: 'This section would contain a richer, multi-paragraph explanation with examples, cautions, and strategic considerations tailored to the concept represented by the original tip.',
        keyPoints: [
            'Key mechanism behind effectiveness',
            'Common pitfalls to avoid',
            'Metric to track progress'
        ],
        actionPlan: [
            'Define a measurable objective',
            'Break the objective into weekly milestones',
            'Schedule a recurring review to adjust'
        ],
        sources: [
            { title: 'Investopedia (concept overview)', url: 'https://www.investopedia.com/' },
            { title: 'Bogleheads Wiki (practical guidance)', url: 'https://www.bogleheads.org/wiki/' }
        ],
        model,
        generatedAt: now,
        createdAt: now
    };
}

// Fallback quick generator (used if MCP fails)
export async function expandTipFallback(tipId: string): Promise<AIExpandedTip> {
    return expandTipViaMCP(tipId, 'stub-fallback');
}
