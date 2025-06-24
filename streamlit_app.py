import streamlit as st
import requests


all_products = [
    {"name": "Office Laptop A", "description": "Intel i5, 8GB RAM"},
    {"name": "Gaming Monitor", "description": "144Hz G-Sync monitor"},
    {"name": "Gaming Laptop X", "description": "RTX 4060, 16GB RAM, 144Hz display"},
    {"name": "Gaming Laptop Z", "description": "RTX 4060, RGB, 32GB RAM"}
]

# ----------------------------
# 🧠 Streamlit UI
# ----------------------------
st.set_page_config(page_title="AI Product Recommender", layout="centered")
st.title("🎯 AI Product Recommender")

# Dropdown to choose the target product
product_names = [product["name"] for product in all_products]
selected_name = st.selectbox("Select a product", product_names)

# Match selected product object
target_product = next(p for p in all_products if p["name"] == selected_name)

if st.button("🔍 Get Recommendations"):
    try:
        with st.spinner("Asking the AI..."):
            # Call your proxy API
            response = requests.post(
                "http://localhost:3000/recommend",
                json={
                    "targetProduct": target_product,
                    "allProducts": all_products
                }
            )
            response.raise_for_status()
            recommendations = response.json()

            st.success("✅ Recommendations ready!")
            for rec in recommendations:
                st.markdown(f"""
                **{rec['name']}**
                - {rec['description']}
                """)

    except Exception as e:
        st.error(f"❌ Failed to fetch recommendations: {e}")
