import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
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
    const { data, error } = await this.supabase.from('trips').insert([tripData]).select();

    if (error) {
      console.error('❌ Supabase create error:', error);
      throw error;
    }
    return data;
  }

  // Delete a trip from Supabase
  async deleteTrip(id: number) {
    const { error } = await this.supabase.from('trips').delete().eq('id', id);

    if (error) {
      console.error('❌ Supabase delete error:', error);
      throw error;
    }
  }

  // Add these inside your existing Supabase service class if not present:
  async getActivities() {
    const { data, error } = await this.supabase.from('activities').select('*');
    if (error) throw error;
    return data;
  }

  async createActivity(activity: { trip_id: number; title: string; cost: number }) {
    const { data, error } = await this.supabase.from('activities').insert([activity]);
    if (error) throw error;
    return data;
  }

  async getSettings() {
    const { data, error } = await this.supabase
      .from('settings')
      .select('max_wallet_limit')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
    return data;
  }

  async updateMaxWalletLimit(newLimit: number) {
    const { data, error } = await this.supabase
      .from('settings')
      .update({ max_wallet_limit: newLimit })
      .eq('id', 1);

    if (error) throw error;
    return data;
  }
}
