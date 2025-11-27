import { supabase } from "../../../utils/supabaseClient.js";

async function loadCounts() {
    const { data: tickets } = await supabase.from("tickets").select("*");
    const { data: locataires } = await supabase.from("locataires").select("*");
    const { data: entreprises } = await supabase.from("entreprises").select("*");

    document.getElementById("countTickets").textContent = tickets?.length ?? 0;
    document.getElementById("countLocataires").textContent = locataires?.length ?? 0;
    document.getElementById("countEntreprises").textContent = entreprises?.length ?? 0;
}

loadCounts();
