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

  // Update the visited status of a trip
  async updateTripStatus(id: number, visited: boolean) {
    const { error } = await this.supabase
      .from('trips')
      .update({ visited })
      .eq('id', id);

    if (error) {
      console.error('❌ Supabase update status error:', error);
      throw error;
    }
  }

  // --- ACTIVITY DATA METHODS ---

  // Fetch all activities for a specific trip (scoped by trip_id)
  async getActivities(tripId: number) {
    const { data, error } = await this.supabase
      .from('activities')
      .select('*')
      .eq('trip_id', tripId)
      .order('day_number', { ascending: true });

    if (error) {
      console.error('❌ Supabase fetch activities error:', error);
      throw error;
    }
    return data;
  }

  // Add a new activity for a trip (with full fields)
  async createActivity(activityData: {
    trip_id: number;
    title: string;
    day_number?: number | null;
    time?: string | null;
    cost?: number | null;
    location_name?: string | null;
  }) {
    const { data, error } = await this.supabase
      .from('activities')
      .insert([activityData])
      .select();

    if (error) {
      console.error('❌ Supabase create activity error:', error);
      throw error;
    }
    return data;
  }

  // Delete an activity by id
  async deleteActivity(id: number) {
    const { error } = await this.supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Supabase delete activity error:', error);
      throw error;
    }
  }

  // --- SETTINGS DATA METHODS ---

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
