import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Supabase } from './services/supabase'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private supabaseService = inject(Supabase);
  trips: any[] = [];
  
  // Tab Controller Engine Link
  currentTab: string = 'planner'; 

  async ngOnInit() {
    await this.fetchTrips();
  }

  switchTab(tabName: string) {
    this.currentTab = tabName;
  }

  async fetchTrips() {
    try {
      this.trips = await this.supabaseService.getTrips() || [];
    } catch (error) {
      console.error('❌ Error fetching trips:', error);
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
      await this.fetchTrips(); // Automatically updates the counts and UI feed items
    } catch (error) {
      console.error('❌ Error saving new trip:', error);
    }
  }

  // --- BONUS LOGIC: DELETE LAYOUT SELECTION ACTION ---
  async onDelete(id: number) {
    if(confirm("Are you sure you want to remove this map entry? 🧸")) {
      try {
        // (Make sure to verify if you added the delete method into your supabase.ts file)
        await (this.supabaseService as any).deleteTrip(id);
        await this.fetchTrips();
      } catch (error) {
        console.error('❌ Error eliminating entry:', error);
      }
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