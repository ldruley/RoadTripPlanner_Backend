import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class HereApiService {
    private readonly apiKey: string;
    private readonly baseUrl: string = 'https://discover.search.hereapi.com/v1';

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('app.hereApiKey') || '';
    }

    async searchLocations(query: string, limit: number = 10) {
        try {
            const response = await axios.get(`${this.baseUrl}/discover`, {
                params: {
                    apiKey: this.apiKey,
                    q: query,
                    limit
                }
            });
            return response.data;
        } catch (error) {
            throw new Error(`HERE API search failed: ${error.message}`);
        }
    }

    async searchPOI(category: string, lat: number, lng: number, radius: number = 5000, limit: number = 10) {
        try {
            const response = await axios.get(`${this.baseUrl}/browse`, {
                params: {
                    apiKey: this.apiKey,
                    at: `${lat},${lng}`,
                    categories: category,
                    limit,
                    radius
                }
            });
            return response.data;
        } catch (error) {
            throw new Error(`HERE API POI search failed: ${error.message}`);
        }
    }

    // more endpoints maybe
}