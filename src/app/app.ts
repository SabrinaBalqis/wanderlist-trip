import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Supabase } from './services/supabase'; 
import { CommonModule } from '@angular/common';
import { SafeUrlPipe } from './pipes/safe-url.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SafeUrlPipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private supabaseService = inject(Supabase);
  private cdr = inject(ChangeDetectorRef);
  trips: any[] = [];

  // Tab Controller Engine Link
  currentTab: string = 'planner';

  // Image URL preview state (used in template inline expressions)
  previewUrl: string = '';
  previewError: boolean = false;

  async ngOnInit() {
    await this.fetchTrips();
  }

  switchTab(tabName: string) {
    this.currentTab = tabName;
  }

  async fetchTrips() {
    try {
      const data = await this.supabaseService.getTrips();
      this.trips = data || [];
      this.cdr.detectChanges();
      console.log('✅ Trips loaded:', this.trips);
    } catch (error) {
      console.error('❌ Error fetching trips:', error);
      this.trips = [];
      this.cdr.detectChanges();
    }
  }

  // --- MODULE 1: CREATE LOGIC ENGINE ---
  async onAddTrip(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const newTrip = {
      destination: formData.get('destination') as string,
      start_date: formData.get('startDate') as string,
      end_date: formData.get('endDate') as string,
      total_budget: parseFloat(formData.get('budget') as string) || 0,
      image_url: formData.get('imageUrl') as string || null
    };

    try {
      await this.supabaseService.createTrip(newTrip);
      form.reset();
      this.previewUrl = '';      // clear preview after submit
      this.previewError = false;
      await this.fetchTrips(); // Automatically updates the counts and UI feed items
    } catch (error) {
      console.error('❌ Error saving new trip:', error);
    }
  }

  // --- BONUS LOGIC: DELETE LAYOUT SELECTION ACTION ---
  async onDelete(id: number) {
    if(confirm("Are you sure you want to remove this map entry? 🧸")) {
      try {
        await this.supabaseService.deleteTrip(id);
        await this.fetchTrips();
      } catch (error) {
        console.error('❌ Error eliminating entry:', error);
      }
    }
  }

  // --- MODULE 3: TRIP STATUS TOGGLE ---
  async onToggleTripStatus(trip: any) {
    const newVisited = !trip.visited;
    trip.visited = newVisited; // Optimistic update for instant UI feedback
    this.cdr.detectChanges();
    try {
      await this.supabaseService.updateTripStatus(trip.id, newVisited);
    } catch (error) {
      // Rollback on failure
      trip.visited = !newVisited;
      this.cdr.detectChanges();
      console.error('❌ Error updating trip status:', error);
    }
  }

  // --- MODULE 2: RECTIFY MATHEMATICAL ANALYTICS SUMS ---
  calculateTotalBudget(): number {
    return this.trips.reduce((sum, trip) => sum + (trip.total_budget || 0), 0);
  }

  calculateAverageBudget(): number {
    if (this.trips.length === 0) return 0;
    const average = this.calculateTotalBudget() / this.trips.length;
    return Math.round(average); // Returns neat integer value
  }
}