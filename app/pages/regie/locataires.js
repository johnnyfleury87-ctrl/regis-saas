import { supabase } from "../../../utils/supabaseClient.js";

async function loadLocataires() {
    const { data, error } = await supabase.from("locataires").select("*");
    if (error) console.error(error);

    const tbody = document.querySelector("#locatairesTable tbody");
    tbody.innerHTML = "";

    data.forEach(l => {
        tbody.innerHTML += `
            <tr>
                <td>${l.nom}</td>
                <td>${l.email}</td>
                <td>${l.telephone}</td>
                <td>${l.adresse}</td>
            </tr>
        `;
    });
}

loadLocataires();
