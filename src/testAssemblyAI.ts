const key = process.env.EXPO_PUBLIC_ASSEMBLYAI_KEY;
console.log('=== ASSEMBLYAI DEBUG ===');
console.log('Key exists:', !!key);
console.log('Key length:', key?.length ?? 0);
console.log('Key starts with:', key?.substring(0, 8) ?? 'NONE');
console.log('========================');
