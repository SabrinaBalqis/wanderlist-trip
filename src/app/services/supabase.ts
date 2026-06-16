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
      .select('*')
      .order('id', { ascending: false });
    
    if (error) {
      console.error('❌ Supabase fetch error:', error);
      throw error;
    }
    console.log('✅ Supabase returned trips:', data);
    return data;
  }

  // Add a new trip row to your Supabase table
  async createTrip(tripData: any) {
    const { data, error } = await this.supabase
      .from('trips')
      .insert([tripData])
      .select();

    if (error) {
      console.error('❌ Supabase create error:', error);
      throw error;
    }
    return data;
  }

  // Delete a trip from Supabase
  async deleteTrip(id: number) {
    const { error } = await this.supabase
      .from('trips')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Supabase delete error:', error);
      throw error;
    }
  }
}