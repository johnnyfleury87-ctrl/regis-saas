-- Autorise le rôle service_role (utilisé par nos API) à manipuler missions_assignations
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_policies
		WHERE schemaname = 'public'
			AND tablename = 'missions_assignations'
			AND policyname = 'missions_assignations_service_role_policy'
	) THEN
		CREATE POLICY missions_assignations_service_role_policy
			ON public.missions_assignations
			FOR ALL
			USING (auth.role() = 'service_role')
			WITH CHECK (auth.role() = 'service_role');
	END IF;
END $$;
