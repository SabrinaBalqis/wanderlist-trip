import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Supabase {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // --- TRIP DATA METHODS ---

  // Fetch all trips from your Supabase table
  async getTrips() {
    const { data, error } = await this.supabase
      .from('trips')
      .select('*');
    
    if (error) throw error;
    return data;
  }

  // Add a new trip row to your Supabase table
  async createTrip(tripData: any) {
    const { data, error } = await this.supabase
      .from('trips')
      .insert([tripData])
      .select();

    if (error) throw error;
    return data;
  }
}