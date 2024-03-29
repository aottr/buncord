import fs from 'fs';
import path from 'path';
const logger = require('pino')().child({ module: 'DailyNoodle' });
import { Noodle, Provider } from './schemas';
import IProvider, { INoodleMapping } from './providers/provider';

export const loadProviders = (): IProvider[] => {
    const providersDirectory = path.join(__dirname, 'providers');
    const providerFiles = fs.readdirSync(providersDirectory).filter(file => file !== 'provider.ts');;
    const providers = providerFiles.map(file => {
        const { default: provider } = require(path.join(providersDirectory, file));
        return provider;
    });
    return providers;
};

export default async () => {
    logger.info('Initializing Daily Noodle...');
    const providers = loadProviders();
    for (const provider of providers) {
        const noodles: Noodle[] = await Noodle.find({ name: { $in: provider.noodleMapping.map((mapping: INoodleMapping) => mapping.noodleName) } });
        await Provider.findOneAndUpdate({ name: provider.name }, { name: provider.name, noodles }, { upsert: true, runValidators: true });
    }
    ['Otter', 'Ferret', 'Marten'].map(async (name) => await Noodle.findOneAndUpdate({ name }, { name }, { upsert: true, runValidators: true }));
    logger.info('Daily Noodle initialized!');
};